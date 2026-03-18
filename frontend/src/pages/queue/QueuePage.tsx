import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, ChevronRight, Building2, ArrowUpRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { workflowsService } from '@/services/workflows.service'
import { usersService } from '@/services/users.service'

function formatMetadata(metadata?: Record<string, unknown>): Array<[string, string]> {
  if (!metadata) return []
  return Object.entries(metadata)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
    .slice(0, 4)
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

function isDestructiveAction(actionName: string): boolean {
  const lower = actionName.toLowerCase()
  return lower.includes('reject') || lower.includes('cancel') || lower.includes('close')
}

export default function QueuePage() {
  const queryClient = useQueryClient()

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const queueQuery = useQuery({
    queryKey: ['queue'],
    queryFn: workflowsService.getDepartmentQueue,
  })

  const directoryQuery = useQuery({
    queryKey: ['queue-directory', queueQuery.data?.department],
    queryFn: () => usersService.getDirectory({ department: queueQuery.data?.department ?? undefined }),
    enabled: Boolean(queueQuery.data?.department),
  })

  const transitionMutation = useMutation({
    mutationFn: ({ instanceId, actionName }: { instanceId: string; actionName: string }) =>
      workflowsService.transition(instanceId, actionName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['queue'] })
    },
  })

  const reassignMutation = useMutation({
    mutationFn: ({ instanceId, ownerUserId }: { instanceId: string; ownerUserId: string }) =>
      workflowsService.updateInstance(instanceId, { ownerUserId }),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['queue'] }),
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      ])
    },
  })

  if (workflowsQuery.isLoading || queueQuery.isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <LoadingSpinner className="h-7 w-7" />
      </div>
    )
  }

  if (workflowsQuery.isError || queueQuery.isError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
        <p className="text-sm font-medium text-destructive">Unable to load queue</p>
        <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
      </div>
    )
  }

  const workflows = workflowsQuery.data ?? []
  const { department, instances } = queueQuery.data ?? { department: null, instances: [] }
  const ownerCandidates = directoryQuery.data ?? []
  const workflowById = Object.fromEntries(workflows.map((workflow) => [workflow.id, workflow]))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Department Queue</h2>
            {department && (
              <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-0.5 text-[12px] font-medium text-muted-foreground">
                <Building2 size={11} />
                {department}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Open requests routed to your department. Reassign work and advance state from here.
          </p>
        </div>
      </div>

      {!department ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-semibold text-foreground">No department set</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Ask an admin to assign your account to a department.
          </p>
        </div>
      ) : instances.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <Layers size={32} className="mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">Queue is clear</p>
          <p className="mt-1 text-xs text-muted-foreground">
            No open requests currently routed to {department}.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {instances.map((instance) => {
            const workflow = workflowById[instance.workflowId]
            const currentState = workflow?.states?.find((state) => state.id === instance.currentStateId)
            const metadata = formatMetadata(instance.metadata)
            const availableTransitions =
              workflow?.transitions?.filter((transition) => transition.fromStateId === instance.currentStateId) ?? []
            const isReassigning =
              reassignMutation.isPending && reassignMutation.variables?.instanceId === instance.id

            return (
              <div
                key={instance.id}
                className="rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/[0.03]"
              >
                {/* Title row */}
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[14px] font-semibold text-foreground">{instance.title}</p>
                      {currentState && (
                        <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
                      )}
                      <StatusBadge label={instance.priority} color="slate" className="text-[11px] capitalize" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                      <span>{workflow?.name ?? 'Workflow instance'}</span>
                      {instance.ownerDepartment && (
                        <>
                          <span className="text-border">/</span>
                          <span className="font-medium text-foreground/60">{instance.ownerDepartment}</span>
                        </>
                      )}
                      <span className="text-border">/</span>
                      <span>
                        {new Date(instance.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/requests/${instance.id}`}
                    className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ArrowUpRight size={12} />
                    View
                  </Link>
                </div>

                {instance.description && (
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    {instance.description}
                  </p>
                )}

                <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Owner
                    </p>
                    <Select
                      value={instance.ownerUserId ?? 'unassigned'}
                      onValueChange={(value) =>
                        reassignMutation.mutate({
                          instanceId: instance.id,
                          ownerUserId: value === 'unassigned' ? '' : value,
                        })
                      }
                      disabled={isReassigning || ownerCandidates.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {ownerCandidates.map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {instance.watchingDepartments.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Watching
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {instance.watchingDepartments.map((departmentName) => (
                          <span
                            key={departmentName}
                            className="rounded-md border border-border bg-muted/40 px-2.5 py-1 text-[12px] text-muted-foreground"
                          >
                            {departmentName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {metadata.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {metadata.map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-md border border-border bg-muted/30 px-2.5 py-1 text-[12px] text-muted-foreground"
                      >
                        <span className="font-medium text-foreground/70">{formatKey(key)}:</span> {value}
                      </span>
                    ))}
                  </div>
                )}

                {availableTransitions.length > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Actions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {availableTransitions.map((transition) => {
                        const destructive = isDestructiveAction(transition.actionName)
                        const isPending =
                          transitionMutation.isPending &&
                          transitionMutation.variables?.instanceId === instance.id &&
                          transitionMutation.variables?.actionName === transition.actionName

                        return (
                          <Button
                            key={transition.id}
                            size="sm"
                            variant="outline"
                            className={
                              destructive
                                ? 'border-destructive/30 text-destructive hover:border-destructive/60 hover:text-destructive'
                                : undefined
                            }
                            disabled={transitionMutation.isPending}
                            onClick={() =>
                              transitionMutation.mutate({
                                instanceId: instance.id,
                                actionName: transition.actionName,
                              })
                            }
                          >
                            {isPending ? (
                              <LoadingSpinner className="mr-1.5 h-3 w-3" />
                            ) : (
                              <ChevronRight size={13} className="mr-1" />
                            )}
                            {transition.actionLabel}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
