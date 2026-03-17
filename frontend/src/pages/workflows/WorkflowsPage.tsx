import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, GitBranch, Plus } from 'lucide-react'
import {
  getWorkflowBlueprint,
  matchesDepartment,
  workflowCatalog,
  workflowDepartments,
} from '@/config/workflowBlueprints'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
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

export default function WorkflowsPage() {
  const [open, setOpen] = useState(false)
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<string | undefined>(undefined)
  const [department, setDepartment] = useState<string>('All Departments')

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
  const workflowByName = new Map(workflows.map((workflow) => [workflow.name, workflow]))
  const visibleWorkflows = workflowCatalog.filter((workflow) => matchesDepartment(workflow.name, department))

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-border bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(246,248,252,0.95))] px-6 py-6 shadow-[0_10px_30px_rgba(17,24,39,0.05)] sm:px-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80">Workflow Intake</p>
            <h2 className="mt-3 text-[28px] font-semibold tracking-tight text-foreground">
              Start the right process, fast.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Nectar is the control layer for operational work that matters. It prevents handoff failures, standardizes decisions, captures root cause, protects traceability, and makes critical process knowledge reusable across all plants.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[240px_auto] sm:items-end">
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Department</p>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workflowDepartments.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => {
                setSelectedWorkflowName(undefined)
                setOpen(true)
              }}
              className="h-10 sm:min-w-[170px]"
            >
              <Plus size={16} />
              Start Request
            </Button>
          </div>
        </div>
      </section>
      {visibleWorkflows.length === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-lg">No workflows match this department</CardTitle>
            <CardDescription>Choose another department to browse the system workflow catalog.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibleWorkflows.map((catalogItem) => {
            const blueprint = getWorkflowBlueprint(catalogItem.name)
            const backendWorkflow = workflowByName.get(catalogItem.name)
            const lifecycleStates = backendWorkflow?.states ?? []

            return (
              <Card key={catalogItem.name} className="overflow-hidden border-border/80 bg-card/95 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="inline-flex rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {blueprint.category}
                      </div>
                      <CardTitle className="text-lg">{catalogItem.name}</CardTitle>
                      <CardDescription className="max-w-xl text-sm leading-6">
                        {blueprint.summary}
                      </CardDescription>
                    </div>
                    <GitBranch className="mt-1 text-muted-foreground" size={18} />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {blueprint.departments.slice(0, 4).map((departmentLabel) => (
                      <StatusBadge key={departmentLabel} label={departmentLabel} color="blue" className="text-[11px]" />
                    ))}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Why it matters</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{blueprint.impact}</p>
                  </div>

                  {lifecycleStates.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {lifecycleStates.map((state) => (
                        <StatusBadge key={state.id} label={state.label} color={state.color} className="text-[11px]" />
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm text-muted-foreground">
                      {blueprint.outcomes[0]}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedWorkflowName(catalogItem.name)
                          setOpen(true)
                        }}
                      >
                        <Plus size={16} />
                        Start
                      </Button>
                      {backendWorkflow ? (
                        <Link
                          to={`/workflows/${backendWorkflow.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          View workflow
                          <ArrowRight size={14} />
                        </Link>
                      ) : null}
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
          if (!nextOpen) setSelectedWorkflowName(undefined)
        }}
        workflows={workflows}
        initialWorkflowName={selectedWorkflowName}
        initialDepartment={department}
      />
    </div>
  )
}
