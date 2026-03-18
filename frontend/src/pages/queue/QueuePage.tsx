import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Layers, ChevronRight, Building2, ArrowUpRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const ownerCandidates = directoryQuery.data ?? []
  const workflowById = Object.fromEntries(workflows.map((workflow) => [workflow.id, workflow]))

  return (
    <div className="space-y-6">
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
              All open requests routed to your department. Review the current owner, keep watcher
              departments informed, and reassign work when ownership needs to move.
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
            <CardDescription>No open requests are currently routed to {department}.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {instances.map((instance) => {
            const workflow = workflowById[instance.workflowId]
            const currentState = workflow?.states?.find((state) => state.id === instance.currentStateId)
            const metadata = formatMetadata(instance.metadata)
            const availableTransitions =
              workflow?.transitions?.filter((transition) => transition.fromStateId === instance.currentStateId) ?? []
            const isReassigning =
              reassignMutation.isPending && reassignMutation.variables?.instanceId === instance.id

            return (
              <Card key={instance.id} className="border-border/80">
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-lg font-semibold text-foreground">{instance.title}</p>
                      <Link
                        to={`/requests/${instance.id}`}
                        className="ml-auto flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <ArrowUpRight size={12} />
                        View
                      </Link>
                      {currentState && (
                        <StatusBadge label={currentState.label} color={currentState.color} className="text-[11px]" />
                      )}
                      <StatusBadge label={instance.priority} color="slate" className="text-[11px] capitalize" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{workflow?.name ?? 'Workflow instance'}</span>
                      {instance.ownerDepartment && (
                        <>
                          <span className="text-border">/</span>
                          <span className="text-xs font-medium text-foreground/60">{instance.ownerDepartment}</span>
                        </>
                      )}
                      <span className="text-border">/</span>
                      <span>Created {new Date(instance.createdAt).toLocaleDateString()}</span>
                    </div>

                    {instance.description && (
                      <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{instance.description}</p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,220px)_1fr]">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Owner User
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
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          Watching Departments
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {instance.watchingDepartments.map((departmentName) => (
                            <div
                              key={departmentName}
                              className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                            >
                              {departmentName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {metadata.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {metadata.map(([key, value]) => (
                        <div
                          key={key}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground"
                        >
                          <span className="font-medium text-foreground/70">{formatKey(key)}:</span> {value}
                        </div>
                      ))}
                    </div>
                  )}

                  {availableTransitions.length > 0 && (
                    <div className="border-t border-border pt-4">
                      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        Available Actions
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableTransitions.map((transition) => {
                          const destructive = isDestructiveAction(transition.actionName)
                          const variant = getTransitionVariant(transition.actionName)
                          const isPending =
                            transitionMutation.isPending &&
                            transitionMutation.variables?.instanceId === instance.id &&
                            transitionMutation.variables?.actionName === transition.actionName

                          return (
                            <Button
                              key={transition.id}
                              size="sm"
                              variant={variant}
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
