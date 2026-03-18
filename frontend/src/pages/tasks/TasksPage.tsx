import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardList, Plus, ChevronRight, ArrowUpRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { workflowsService } from '@/services/workflows.service'

function formatMetadata(metadata?: Record<string, unknown>): Array<[string, string]> {
  if (!metadata) return []
  return Object.entries(metadata)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0)
    .slice(0, 4)
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

function getTransitionVariant(actionName: string): 'default' | 'outline' {
  const lower = actionName.toLowerCase()
  if (lower.includes('approve') || lower.includes('complete') || lower.includes('submit')) {
    return 'default'
  }
  return 'outline'
}

function isDestructiveAction(actionName: string): boolean {
  const lower = actionName.toLowerCase()
  return lower.includes('reject') || lower.includes('cancel') || lower.includes('close')
}

export default function TasksPage() {
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => workflowsService.getInstances(),
  })

  const transitionMutation = useMutation({
    mutationFn: ({ instanceId, actionName }: { instanceId: string; actionName: string }) =>
      workflowsService.transition(instanceId, actionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
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
      {/* Page header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ClipboardList size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Tasks</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Track the operational work tied to you. Each request shows its owner, owning department,
                watcher visibility, and the actions you can take.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setStartDialogOpen(true)}
            className="shrink-0"
          >
            <Plus size={16} />
            Start New Request
          </Button>
        </div>
      </section>

      {/* Task list */}
      {tasks.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No active requests</CardTitle>
            <CardDescription>
              Once a workflow is started, it will appear here with its current status.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tasks.map((task) => {
            const workflow = workflowById[task.workflowId]
            const currentState = workflow?.states?.find((state) => state.id === task.currentStateId)
            const metadata = formatMetadata(task.metadata)
            const availableTransitions =
              workflow?.transitions?.filter((t) => t.fromStateId === task.currentStateId) ?? []

            return (
              <Card key={task.id} className="border-border/80">
                <CardContent className="flex flex-col gap-4 p-5">
                  {/* Title row */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{task.title}</p>
                      <Link
                        to={`/requests/${task.id}`}
                        className="ml-auto flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <ArrowUpRight size={12} />
                        View
                      </Link>
                      {currentState ? (
                        <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
                      ) : null}
                      <StatusBadge label={task.priority} color="slate" className="text-[11px] capitalize" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{workflow?.name ?? 'Workflow instance'}</span>
                      {task.ownerDepartment && (
                        <>
                          <span className="text-border">/</span>
                          <span className="text-xs font-medium text-foreground/60">{task.ownerDepartment}</span>
                        </>
                      )}
                      {task.ownerUser?.name && (
                        <>
                          <span className="text-border">/</span>
                          <span className="text-xs font-medium text-foreground/60">Owner: {task.ownerUser.name}</span>
                        </>
                      )}
                      <span className="text-border">/</span>
                      <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                      {task.completedAt ? (
                        <>
                          <span className="text-border">/</span>
                          <span className="text-success">
                            Completed {new Date(task.completedAt).toLocaleDateString()}
                          </span>
                        </>
                      ) : null}
                    </div>

                    {task.description ? (
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{task.description}</p>
                    ) : null}
                  </div>

                  {/* Metadata pills */}
                  {metadata.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {metadata.map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
                        >
                          <span className="font-medium text-foreground/70">{formatKey(key)}:</span>{' '}
                          {value}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {task.watchingDepartments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.watchingDepartments.map((department) => (
                        <div
                          key={department}
                          className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                        >
                          Watching: <span className="font-medium text-foreground/70">{department}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Available Actions */}
                  {availableTransitions.length > 0 ? (
                    <div className="border-t border-border pt-4">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Available Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableTransitions.map((t) => {
                          const destructive = isDestructiveAction(t.actionName)
                          const variant = getTransitionVariant(t.actionName)
                          const isPending =
                            transitionMutation.isPending &&
                            transitionMutation.variables?.instanceId === task.id &&
                            transitionMutation.variables?.actionName === t.actionName

                          return (
                            <Button
                              key={t.id}
                              size="sm"
                              variant={variant}
                              className={
                                destructive
                                  ? 'text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60'
                                  : undefined
                              }
                              disabled={transitionMutation.isPending}
                              onClick={() =>
                                transitionMutation.mutate({ instanceId: task.id, actionName: t.actionName })
                              }
                            >
                              {isPending ? (
                                <LoadingSpinner className="mr-1.5 h-3 w-3" />
                              ) : (
                                <ChevronRight size={13} className="mr-1" />
                              )}
                              {t.actionLabel}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <StartWorkflowDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        workflows={workflows}
      />
    </div>
  )
}
