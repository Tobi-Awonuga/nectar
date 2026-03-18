import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Clock, Check, X, ChevronRight, ArrowUpRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { approvalsService } from '@/services/approvals.service'
import { workflowsService } from '@/services/workflows.service'
import { getWorkflowBlueprint } from '@/config/workflowBlueprints'
import { cn } from '@/lib/utils'

const categoryColors: Record<string, string> = {
  'Operations Control': 'bg-blue-50 text-blue-700 border-blue-200',
  'Warehouse Control': 'bg-amber-50 text-amber-700 border-amber-200',
  'Inventory Control': 'bg-violet-50 text-violet-700 border-violet-200',
  'Warehouse Movement': 'bg-orange-50 text-orange-700 border-orange-200',
  'Production Control': 'bg-green-50 text-green-700 border-green-200',
  'Systems Support': 'bg-slate-50 text-slate-700 border-slate-200',
  'Compliance': 'bg-red-50 text-red-700 border-red-200',
  'Human Resources': 'bg-pink-50 text-pink-700 border-pink-200',
}

function getCategoryColor(category: string) {
  return categoryColors[category] ?? 'bg-muted text-muted-foreground border-border'
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-red-50 text-red-700 border border-red-200' },
  high:     { label: 'High',     className: 'bg-orange-50 text-orange-700 border border-orange-200' },
  medium:   { label: 'Medium',   className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  low:      { label: 'Low',      className: 'bg-slate-50 text-slate-600 border border-slate-200' },
}

function formatKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim()
}

function formatRelativeDate(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isDestructiveAction(actionName: string) {
  return actionName === 'reject' || actionName.startsWith('reject_') || actionName === 'decline' || actionName.startsWith('decline_')
}

export default function ApprovalsPage() {
  const queryClient = useQueryClient()
  const [succeededIds, setSucceededIds] = useState<Set<string>>(new Set())

  const approvalsQuery = useQuery({
    queryKey: ['approvals'],
    queryFn: approvalsService.getPending,
  })

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const transitionMutation = useMutation({
    mutationFn: ({ instanceId, actionName }: { instanceId: string; actionName: string }) =>
      workflowsService.transition(instanceId, actionName),
    onSuccess: (_data, variables) => {
      setSucceededIds((prev) => new Set(prev).add(variables.instanceId))
      void queryClient.invalidateQueries({ queryKey: ['approvals'] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // Remove success highlight after a short delay
      setTimeout(() => {
        setSucceededIds((prev) => {
          const next = new Set(prev)
          next.delete(variables.instanceId)
          return next
        })
      }, 2000)
    },
  })

  const isLoading = approvalsQuery.isLoading || workflowsQuery.isLoading
  const isError = approvalsQuery.isError || workflowsQuery.isError
  const approvals = approvalsQuery.data ?? []
  const workflows = workflowsQuery.data ?? []

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold text-foreground">Approvals</h2>
          {!isLoading && approvals.length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">
              {approvals.length}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and action pending requests waiting for your decision.
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load approvals</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              void approvalsQuery.refetch()
              void workflowsQuery.refetch()
            }}
          >
            Retry
          </Button>
        </div>
      ) : approvals.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center shadow-sm shadow-black/[0.03]">
          <ShieldCheck size={32} className="mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">No pending approvals — all caught up</p>
          <p className="mt-1 text-xs text-muted-foreground">New approvals will appear here when requests need your action.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((item) => {
            const workflow = workflows.find((wf) => wf.id === item.workflowId)
            const blueprint = getWorkflowBlueprint(workflow ?? item.workflowId)
            const availableTransitions = workflow?.transitions?.filter(
              (t) => t.fromStateId === item.currentStateId
            ) ?? []
            const metaEntries = item.metadata ? Object.entries(item.metadata).slice(0, 3) : []
            const priority = priorityConfig[item.priority?.toLowerCase()] ?? priorityConfig.medium
            const isSucceeded = succeededIds.has(item.id)
            const isMutating = transitionMutation.isPending && transitionMutation.variables?.instanceId === item.id

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-xl border bg-card p-5 shadow-sm shadow-black/[0.03] transition-all',
                  isSucceeded
                    ? 'border-green-200 bg-green-50/40'
                    : 'border-border hover:shadow-md hover:shadow-black/[0.06]'
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: info */}
                  <div className="min-w-0 flex-1 space-y-2.5">
                    {/* Category + workflow name */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold',
                          getCategoryColor(blueprint.category)
                        )}
                      >
                        {blueprint.category}
                      </span>
                      {workflow && (
                        <span className="text-[12px] text-muted-foreground">{workflow.name}</span>
                      )}
                    </div>

                    {/* Title */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-foreground leading-snug">{item.title}</h3>
                      <Link
                        to={`/requests/${item.id}`}
                        className="flex shrink-0 items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      >
                        <ArrowUpRight size={12} />
                        View
                      </Link>
                    </div>

                    {/* Current state + meta */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.currentState ? (
                        <StatusBadge
                          label={item.currentState.label}
                          color={item.currentState.color ?? 'slate'}
                        />
                      ) : null}
                      {metaEntries.map(([key, val]) => (
                        <span
                          key={key}
                          className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {formatKey(key)}: {String(val)}
                        </span>
                      ))}
                    </div>

                    {/* Created by + date */}
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <Clock size={11} className="shrink-0" />
                      <span>
                        Submitted by <span className="font-medium text-foreground">{item.createdByUser?.name ?? item.createdBy}</span>
                      </span>
                      <ChevronRight size={10} className="text-muted-foreground/40" />
                      <span>{formatRelativeDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Right: priority + actions */}
                  <div className="flex flex-col items-start gap-3 sm:items-end shrink-0">
                    {/* Priority */}
                    <span
                      className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
                        priority.className
                      )}
                    >
                      {priority.label}
                    </span>

                    {/* Transition buttons */}
                    {isSucceeded ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-green-100 px-3 py-1.5 text-xs font-medium text-green-700">
                        <Check size={13} />
                        Action taken
                      </span>
                    ) : availableTransitions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {availableTransitions.map((transition) => {
                          const destructive = isDestructiveAction(transition.actionName)
                          return (
                            <Button
                              key={transition.id}
                              size="sm"
                              variant="outline"
                              disabled={isMutating}
                              className={cn(
                                'h-8 px-3 text-xs font-medium',
                                destructive
                                  ? 'border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50'
                                  : ''
                              )}
                              onClick={() =>
                                transitionMutation.mutate({
                                  instanceId: item.id,
                                  actionName: transition.actionName,
                                })
                              }
                            >
                              {isMutating && transitionMutation.variables?.actionName === transition.actionName ? (
                                <LoadingSpinner className="h-3 w-3" />
                              ) : destructive ? (
                                <X size={12} />
                              ) : (
                                <Check size={12} />
                              )}
                              {transition.actionLabel}
                            </Button>
                          )
                        })}
                      </div>
                    ) : (
                      <span className="text-[12px] text-muted-foreground italic">No actions available</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
