import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, GitBranch, Plus, Search } from 'lucide-react'
import { getWorkflowBlueprint, matchesDepartment, workflowDepartments } from '@/config/workflowBlueprints'
import { StartWorkflowDialog } from '@/components/workflows/StartWorkflowDialog'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { workflowsService } from '@/services/workflows.service'
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
  'Procurement': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Access Control': 'bg-gray-100 text-gray-700 border-gray-200',
  'Operations': 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

function getCategoryColor(category: string) {
  return categoryColors[category] ?? 'bg-muted text-muted-foreground border-border'
}

export default function WorkflowsPage() {
  const [open, setOpen] = useState(false)
  const [selectedWorkflowName, setSelectedWorkflowName] = useState<string | undefined>()
  const [activeDept, setActiveDept] = useState<string>('All Departments')
  const [search, setSearch] = useState('')

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const workflows = workflowsQuery.data ?? []

  const filtered = workflows.filter((wf) => {
    const blueprint = getWorkflowBlueprint(wf)
    const matchesDept = matchesDepartment(wf, activeDept)
    const matchesSearch =
      !search.trim() ||
      wf.name.toLowerCase().includes(search.toLowerCase()) ||
      blueprint.summary.toLowerCase().includes(search.toLowerCase()) ||
      blueprint.category.toLowerCase().includes(search.toLowerCase())
    return matchesDept && matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Workflows</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start and track operational requests across your plants and departments.
          </p>
        </div>
        <Button
          onClick={() => { setSelectedWorkflowName(undefined); setOpen(true) }}
          className="shrink-0"
        >
          <Plus size={15} />
          New Request
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workflows..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Department filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {workflowDepartments.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
              activeDept === dept
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* Content */}
      {workflowsQuery.isLoading ? (
        <div className="flex min-h-[260px] items-center justify-center">
          <LoadingSpinner className="h-7 w-7" />
        </div>
      ) : workflowsQuery.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load workflows</p>
          <p className="mt-1 text-xs text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void workflowsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <GitBranch size={28} className="mx-auto text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-foreground">No workflows found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search ? 'Try a different search term.' : 'No templates match this department filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((workflow) => {
            const blueprint = getWorkflowBlueprint(workflow)
            const stateCount = workflow.states?.length ?? 0
            const transitionCount = workflow.transitions?.length ?? 0

            return (
              <div
                key={workflow.id}
                className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm shadow-black/[0.03] transition-shadow hover:shadow-md hover:shadow-black/[0.06]"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold', getCategoryColor(blueprint.category))}>
                      {blueprint.category}
                    </span>
                    <h3 className="text-[15px] font-semibold text-foreground leading-snug">{workflow.name}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{blueprint.summary}</p>
                  </div>
                  <GitBranch size={16} className="mt-0.5 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground" />
                </div>

                {/* Departments */}
                {blueprint.departments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {blueprint.departments.slice(0, 4).map((dept) => (
                      <span key={dept} className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {dept}
                      </span>
                    ))}
                    {blueprint.departments.length > 4 && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        +{blueprint.departments.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* State flow */}
                {workflow.states && workflow.states.length > 0 && (
                  <div className="mt-4 flex items-center gap-1 overflow-x-auto">
                    {workflow.states.map((state, idx) => (
                      <div key={state.id} className="flex items-center gap-1 shrink-0">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground whitespace-nowrap">
                          {state.label}
                        </span>
                        {idx < workflow.states!.length - 1 && (
                          <ArrowRight size={10} className="text-muted-foreground/40 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-[12px] text-muted-foreground">
                    {stateCount} states · {transitionCount} transitions
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-xs"
                      onClick={() => { setSelectedWorkflowName(workflow.name); setOpen(true) }}
                    >
                      <Plus size={12} />
                      Start
                    </Button>
                    <Link to={`/workflows/${workflow.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Details
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <StartWorkflowDialog
        open={open}
        onOpenChange={(next) => { setOpen(next); if (!next) setSelectedWorkflowName(undefined) }}
        workflows={workflows}
        initialWorkflowName={selectedWorkflowName}
      />
    </div>
  )
}
