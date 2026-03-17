import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDot, Clock3, Plus } from 'lucide-react'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getWorkflowBlueprint } from '@/config/workflowBlueprints'
import { workflowsService } from '@/services/workflows.service'

export default function WorkflowDetailPage() {
  const { id = '' } = useParams()
  const [open, setOpen] = useState(false)

  const workflowQuery = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsService.getWorkflow(id),
    enabled: Boolean(id),
  })

  if (workflowQuery.isLoading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center">
        <LoadingSpinner className="h-7 w-7" />
      </div>
    )
  }

  if (workflowQuery.isError || !workflowQuery.data) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-lg">Workflow unavailable</CardTitle>
          <CardDescription>This workflow could not be loaded right now.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const workflow = workflowQuery.data
  const blueprint = getWorkflowBlueprint(workflow)
  const states = workflow.states ?? []
  const transitions = workflow.transitions ?? []
  const stateById = Object.fromEntries(states.map((state) => [state.id, state]))

  return (
    <div className="space-y-6">
      <Link to="/workflows" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} />
        Back to Workflows
      </Link>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-border bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {blueprint.category}
            </div>
            <h2 className="mt-4 text-3xl font-semibold text-foreground">{workflow.name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{blueprint.summary}</p>
            <p className="mt-4 text-sm leading-6 text-foreground/88">{blueprint.impact}</p>
          </div>
          <Button onClick={() => setOpen(true)}>
            <Plus size={16} />
            Start This Workflow
          </Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How This Workflow Works</CardTitle>
            <CardDescription>
              End users should understand the process before they submit a request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {states.map((state, index) => (
              <div key={state.id}>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {state.isFinal ? (
                      <CheckCircle2 size={18} className="mt-1 text-success" />
                    ) : state.isInitial ? (
                      <CircleDot size={18} className="mt-1 text-primary" />
                    ) : (
                      <Clock3 size={18} className="mt-1 text-warning" />
                    )}
                    {index < states.length - 1 ? <div className="mt-2 h-10 w-px bg-border" /> : null}
                  </div>
                  <div className="min-w-0 flex-1 pb-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{state.label}</p>
                      {state.isInitial ? <StatusBadge label="Entry" color="blue" className="text-[11px]" /> : null}
                      {state.isFinal ? <StatusBadge label="Outcome" color={state.color} className="text-[11px]" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {transitions
                        .filter((transition) => transition.fromStateId === state.id)
                        .map(
                          (transition) =>
                            `${transition.actionLabel} -> ${stateById[transition.toStateId]?.label ?? 'Next state'}`,
                        )
                        .join(' | ') || 'No outgoing transitions from this state.'}
                    </p>
                  </div>
                </div>
                {index < states.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Applicable Departments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blueprint.departments.map((department) => (
                <div
                  key={department}
                  className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground"
                >
                  {department}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What Requestors Must Provide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blueprint.fields.map((field) => (
                <div key={field.key} className="rounded-2xl border border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{field.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{field.placeholder}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Guidance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blueprint.guidance.map((tip) => (
                <div
                  key={tip}
                  className="rounded-2xl border border-border bg-muted/25 px-4 py-3 text-sm text-muted-foreground"
                >
                  {tip}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Process Outcome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {blueprint.outcomes.map((outcome) => (
                <div key={outcome} className="flex items-start gap-3">
                  <ArrowRight size={15} className="mt-0.5 shrink-0 text-primary" />
                  <p className="text-sm text-muted-foreground">{outcome}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <StartWorkflowDialog
        open={open}
        onOpenChange={setOpen}
        workflows={[workflow]}
        initialWorkflowName={workflow.name}
        initialDepartment={blueprint.departments[0]}
      />
    </div>
  )
}
