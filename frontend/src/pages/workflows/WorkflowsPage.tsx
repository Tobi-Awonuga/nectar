import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, GitBranch, Plus, ShieldCheck, TimerReset, Users } from 'lucide-react'
import { getWorkflowBlueprint } from '@/config/workflowBlueprints'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { workflowsService } from '@/services/workflows.service'

export default function WorkflowsPage() {
  const [open, setOpen] = useState(false)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | undefined>(undefined)

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  if (workflowsQuery.isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <LoadingSpinner className="h-7 w-7" />
      </div>
    )
  }

  if (workflowsQuery.isError) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Unable to load workflows</CardTitle>
          <CardDescription>The workflow templates could not be fetched right now.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => void workflowsQuery.refetch()}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  const workflows = workflowsQuery.data ?? []

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-[linear-gradient(135deg,rgba(20,36,78,0.98),rgba(36,64,132,0.96)_52%,rgba(251,252,255,0.18))] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Workflow Intake</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Turn recurring operational work into a controlled process.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">
              In Nectar, workflows are the front door for work that needs ownership, approvals, and auditability.
              Users should know when to use a template, what information matters, and what outcome the process drives.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedWorkflowId(undefined)
                setOpen(true)
              }}
              className="border border-white/15 bg-white text-slate-900 hover:bg-white/90"
            >
              <Plus size={16} />
              Start New Request
            </Button>
          </div>
        </div>
      </section>

      {workflows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No workflow templates available</CardTitle>
            <CardDescription>Add templates first, then create workflow instances from this page.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {workflows.map((workflow) => {
            const blueprint = getWorkflowBlueprint(workflow)

            return (
              <Card key={workflow.id} className="overflow-hidden border-border/80 bg-card/95">
                <div className="h-1.5 bg-[linear-gradient(90deg,hsl(var(--primary)),hsl(var(--warning)),hsl(var(--success)))]" />
                <CardHeader className="space-y-4 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="inline-flex rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {blueprint.category}
                      </div>
                      <CardTitle className="text-xl">{workflow.name}</CardTitle>
                      <CardDescription className="max-w-xl text-[13px] leading-6">
                        {blueprint.summary}
                      </CardDescription>
                    </div>
                    <GitBranch className="mt-1 text-muted-foreground" size={18} />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-border bg-muted/30 px-3 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <TimerReset size={13} />
                        Flow
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">
                        {workflow.states?.length ?? 0} states / {workflow.transitions?.length ?? 0} actions
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 px-3 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <Users size={13} />
                        Audience
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">{blueprint.forWhom.join(', ')}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 px-3 py-3">
                      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        <ShieldCheck size={13} />
                        Value
                      </div>
                      <p className="mt-2 text-sm font-semibold text-foreground">{blueprint.impact}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Best Used For</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {blueprint.useCases.map((useCase) => (
                        <StatusBadge key={useCase} label={useCase} color="blue" className="text-[11px]" />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Lifecycle</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(workflow.states ?? []).map((state) => (
                        <StatusBadge key={state.id} label={state.label} color={state.color} className="text-[11px]" />
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm text-muted-foreground">
                      {blueprint.outcomes[0]}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWorkflowId(workflow.id)
                          setOpen(true)
                        }}
                      >
                        <Plus size={16} />
                        Start
                      </Button>
                      <Link
                        to={`/workflows/${workflow.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        View workflow
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <StartWorkflowDialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) setSelectedWorkflowId(undefined)
        }}
        workflows={workflows}
        initialWorkflowId={selectedWorkflowId}
      />
    </div>
  )
}
