import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layers, ChevronRight, Building2 } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
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
  if (lower.includes('approve') || lower.includes('complete') || lower.includes('submit')) return 'default'
  return 'outline'
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

  const transitionMutation = useMutation({
    mutationFn: ({ instanceId, actionName }: { instanceId: string; actionName: string }) =>
      workflowsService.transition(instanceId, actionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] })
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
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Unable to load queue</CardTitle>
          <CardDescription>The department queue could not be fetched right now.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const workflows = workflowsQuery.data ?? []
  const { department, instances } = queueQuery.data ?? { department: null, instances: [] }
  const workflowById = Object.fromEntries(workflows.map((w) => [w.id, w]))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Layers size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-2xl font-semibold text-foreground">Department Queue</h2>
              {department && (
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-0.5 text-[12px] font-medium text-muted-foreground">
                  <Building2 size={11} />
                  {department}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              All open requests routed to your department. Work these in order of priority — take action or reassign as needed.
            </p>
          </div>
        </div>
      </section>

      {!department ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No department set</CardTitle>
            <CardDescription>
              Your account is not assigned to a department. Ask an admin to update your profile.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : instances.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Queue is clear</CardTitle>
            <CardDescription>
              No open requests are currently routed to {department}.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {instances.map((instance) => {
            const workflow = workflowById[instance.workflowId]
            const currentState = workflow?.states?.find((s) => s.id === instance.currentStateId)
            const metadata = formatMetadata(instance.metadata)
            const availableTransitions =
              workflow?.transitions?.filter((t) => t.fromStateId === instance.currentStateId) ?? []

            return (
              <Card key={instance.id} className="border-border/80">
                <CardContent className="flex flex-col gap-4 p-5">
                  {/* Title row */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{instance.title}</p>
                      {currentState && (
                        <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
                      )}
                      <StatusBadge label={instance.priority} color="slate" className="text-[11px] capitalize" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{workflow?.name ?? 'Workflow instance'}</span>
                      <span className="text-border">/</span>
                      <span>Created {new Date(instance.createdAt).toLocaleDateString()}</span>
                      {instance.completedAt && (
                        <>
                          <span className="text-border">/</span>
                          <span className="text-success">
                            Completed {new Date(instance.completedAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>

                    {instance.description && (
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{instance.description}</p>
                    )}
                  </div>

                  {/* Metadata pills */}
                  {metadata.length > 0 && (
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
                  )}

                  {/* Available Actions */}
                  {availableTransitions.length > 0 && (
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
                            transitionMutation.variables?.instanceId === instance.id &&
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
                                transitionMutation.mutate({ instanceId: instance.id, actionName: t.actionName })
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
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
