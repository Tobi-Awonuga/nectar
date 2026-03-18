import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  Plus,
  GitBranch,
  Shuffle,
} from 'lucide-react'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
      {/* Back link */}
      <Link
        to="/workflows"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Workflows
      </Link>

      {/* Hero section — two-column layout */}
      <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col gap-0 lg:flex-row">
          {/* Left: workflow identity */}
          <div className="flex-1 p-7 lg:p-8">
            <span className="inline-flex rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground border border-border">
              {blueprint.category}
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">{workflow.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{blueprint.summary}</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">{blueprint.impact}</p>

            {/* Department chips */}
            <div className="mt-5 flex flex-wrap gap-2">
              {blueprint.departments.map((dept) => (
                <span
                  key={dept}
                  className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[12px] font-medium text-muted-foreground"
                >
                  {dept}
                </span>
              ))}
            </div>
          </div>

          {/* Right: stats + CTA */}
          <div className="flex flex-col justify-between gap-5 border-t border-border bg-muted/20 p-7 lg:w-64 lg:border-l lg:border-t-0 lg:p-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <GitBranch size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground">{states.length}</p>
                  <p className="text-[12px] text-muted-foreground">States</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Shuffle size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold tabular-nums text-foreground">{transitions.length}</p>
                  <p className="text-[12px] text-muted-foreground">Transitions</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setOpen(true)} className="w-full">
              <Plus size={16} />
              Start This Workflow
            </Button>
          </div>
        </div>
      </section>

      {/* Two-column content grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Process timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How This Workflow Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 border-l-2 border-primary/25 space-y-0">
              {states.map((state, index) => {
                const outgoingTransitions = transitions.filter((t) => t.fromStateId === state.id)
                const isLast = index === states.length - 1

                return (
                  <div key={state.id} className={isLast ? 'pb-0' : 'pb-7'}>
                    <div className="flex items-start gap-3 -ml-[25px]">
                      {/* State icon node */}
                      <div className="shrink-0 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-card border-2 border-border shadow-sm">
                        {state.isFinal ? (
                          <CheckCircle2 size={15} className="text-success" />
                        ) : state.isInitial ? (
                          <CircleDot size={15} className="text-primary" />
                        ) : (
                          <Clock3 size={14} className="text-warning" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-foreground">{state.label}</p>
                          {state.isInitial && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                              Start
                            </span>
                          )}
                          {state.isFinal && (
                            <StatusBadge label="End" color={state.color} className="text-[10px]" />
                          )}
                        </div>

                        {outgoingTransitions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {outgoingTransitions.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] text-muted-foreground"
                              >
                                <ArrowRight size={9} className="shrink-0 text-primary/60" />
                                <span className="font-medium text-foreground/70">{t.actionLabel}</span>
                                <span className="text-muted-foreground/40">·</span>
                                <span>{stateById[t.toStateId]?.label ?? '…'}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* What Requestors Must Provide */}
          {blueprint.fields.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What Requestors Must Provide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {blueprint.fields.map((field) => {
                  const kindLabel =
                    field.kind === 'textarea'
                      ? 'Long text'
                      : field.kind === 'select'
                        ? 'Select'
                        : 'Text'

                  return (
                    <div key={field.key} className="rounded-xl border border-border px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{field.label}</p>
                        <Badge variant="outline" className="text-[10px] font-medium shrink-0">
                          {kindLabel}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{field.placeholder}</p>
                      {field.kind === 'select' && field.options && field.options.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {field.options.slice(0, 3).map((opt) => (
                            <span
                              key={opt}
                              className="rounded-full bg-muted/40 border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {opt}
                            </span>
                          ))}
                          {field.options.length > 3 ? (
                            <span className="rounded-full bg-muted/40 border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                              +{field.options.length - 3} more
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ) : null}

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
