import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { adminService, type AdminUser } from '@/services/admin.service'
import { workflowDepartments } from '@/config/workflowBlueprints'

const DEPARTMENTS = workflowDepartments.filter((d) => d !== 'All Departments')

export default function DeptDefaultsPage() {
  const queryClient = useQueryClient()

  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: adminService.getUsers })
  const defaultsQuery = useQuery({
    queryKey: ['department-defaults'],
    queryFn: adminService.getDepartmentDefaults,
  })

  const defaultMutation = useMutation({
    mutationFn: ({ department, userId }: { department: string; userId: string }) =>
      adminService.setDepartmentDefault(department, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['department-defaults'] })
      void queryClient.invalidateQueries({ queryKey: ['user-directory'] })
    },
  })

  const users = usersQuery.data ?? []
  const defaultAssignees = defaultsQuery.data ?? []

  const usersByDepartment = DEPARTMENTS.reduce<Record<string, AdminUser[]>>((acc, dept) => {
    acc[dept] = users.filter((u) => u.department === dept && u.isActive)
    return acc
  }, {})

  const defaultByDepartment = new Map(defaultAssignees.map((e) => [e.department, e]))

  const isLoading = usersQuery.isLoading || defaultsQuery.isLoading

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Department Routing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a default assignee for each department. New requests route to these users when no owner is chosen at creation.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm shadow-black/[0.03]">
          <div className="divide-y divide-border">
            {DEPARTMENTS.map((department) => {
              const options = usersByDepartment[department] ?? []
              const currentDefault = defaultByDepartment.get(department)
              const isUpdating =
                defaultMutation.isPending && defaultMutation.variables?.department === department

              return (
                <div
                  key={department}
                  className="grid gap-3 px-5 py-4 md:grid-cols-[220px_minmax(0,1fr)] md:items-center"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{department}</p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {currentDefault?.user?.name ?? 'No default assignee set'}
                    </p>
                  </div>
                  <Select
                    value={currentDefault?.userId ?? 'unassigned'}
                    onValueChange={(value) => {
                      if (value === 'unassigned') return
                      defaultMutation.mutate({ department, userId: value })
                    }}
                    disabled={options.length === 0 || isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          options.length > 0
                            ? 'Select default assignee'
                            : 'No active users in department'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
