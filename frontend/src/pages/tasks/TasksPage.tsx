import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarClock, ClipboardList } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { workflowsService } from '@/services/workflows.service'

function formatMetadata(metadata?: Record<string, unknown>): Array<[string, string]> {
  if (!metadata) return []
  return Object.entries(metadata)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
    .slice(0, 3)
}

export default function TasksPage() {
  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => workflowsService.getInstances(),
  })

  if (workflowsQuery.isLoading || tasksQuery.isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <LoadingSpinner className="h-7 w-7" />
      </div>
    )
  }

  if (workflowsQuery.isError || tasksQuery.isError) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Unable to load requests</CardTitle>
          <CardDescription>Your active workflow instances could not be fetched right now.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const workflows = workflowsQuery.data ?? []
  const tasks = tasksQuery.data ?? []
  const workflowById = Object.fromEntries(workflows.map((workflow) => [workflow.id, workflow]))

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ClipboardList size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">My Requests</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              This is where users track the operational work they started. Each request keeps its current state,
              the workflow it belongs to, and the important submission context that approvers need.
            </p>
          </div>
        </div>
      </section>

      {tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No active requests</CardTitle>
            <CardDescription>Once a workflow is started, it will appear here with its current status.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => {
            const workflow = workflowById[task.workflowId]
            const currentState = workflow?.states?.find((state) => state.id === task.currentStateId)
            const metadata = formatMetadata(task.metadata)

            return (
              <Card key={task.id} className="border-border/80">
                <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{task.title}</p>
                      {currentState ? (
                        <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
                      ) : null}
                      <StatusBadge label={task.priority} color="slate" className="text-[11px] capitalize" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{workflow?.name ?? 'Workflow instance'}</span>
                      <span className="text-border">/</span>
                      <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>

                    {task.description ? (
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{task.description}</p>
                    ) : null}

                    {metadata.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {metadata.map(([key, value]) => (
                          <div
                            key={key}
                            className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
                          >
                            {key}: {value}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex min-w-[220px] flex-col gap-3 rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <CalendarClock size={13} />
                      What Happens Next
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentState
                        ? `This request is currently in ${currentState.label}. The next valid transition depends on the assigned approver or role.`
                        : 'This request is active and waiting for the next workflow action.'}
                    </p>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                      <ArrowRight size={14} />
                      Audit and approvals will build from this state onward.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
