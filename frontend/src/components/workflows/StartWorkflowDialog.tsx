import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getWorkflowBlueprint,
  matchesDepartment,
  workflowCatalog,
  workflowDepartments,
} from '@/config/workflowBlueprints'
import type { Workflow } from '@/types/domain.types'
import { workflowsService } from '@/services/workflows.service'
import { usersService } from '@/services/users.service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type Priority = 'low' | 'medium' | 'high' | 'critical'

interface StartWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflows: Workflow[]
  initialWorkflowName?: string
  initialDepartment?: string
}

export function StartWorkflowDialog({
  open,
  onOpenChange,
  workflows,
  initialWorkflowName,
  initialDepartment,
}: StartWorkflowDialogProps) {
  const queryClient = useQueryClient()
  const workflowByName = new Map(workflows.map((workflow) => [workflow.name, workflow]))
  const [workflowName, setWorkflowName] = useState(initialWorkflowName ?? '')
  const [department, setDepartment] = useState<string>('All Departments')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [ownerUserId, setOwnerUserId] = useState('')
  const [watchingDepartments, setWatchingDepartments] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    setWorkflowName(initialWorkflowName ?? '')
    setTitle('')
    setDescription('')
    setPriority('medium')
    setFormError(null)
    setFieldValues({})
    setOwnerUserId('')

    if (initialWorkflowName) {
      setDepartment(getWorkflowBlueprint(initialWorkflowName).departments[0] ?? initialDepartment ?? 'All Departments')
    } else if (initialDepartment) {
      setDepartment(initialDepartment)
    } else {
      setDepartment('All Departments')
    }
  }, [initialDepartment, initialWorkflowName, open])

  const availableWorkflows = workflowCatalog.filter((workflow) => matchesDepartment(workflow.name, department))
  const selectedWorkflow = workflowByName.get(workflowName)
  const blueprint = getWorkflowBlueprint(workflowName)
  const isWorkflowAvailable = Boolean(selectedWorkflow)
  const ownerDepartment =
    department !== 'All Departments' ? department : (blueprint.departments[0] ?? '')
  const defaultWatchingDepartments = useMemo(
    () => blueprint.departments.filter((candidateDepartment) => candidateDepartment !== ownerDepartment),
    [blueprint.departments, ownerDepartment],
  )

  const directoryQuery = useQuery({
    queryKey: ['user-directory', ownerDepartment],
    queryFn: () => usersService.getDirectory({ department: ownerDepartment }),
    enabled: open && Boolean(ownerDepartment),
  })

  useEffect(() => {
    setFieldValues((current) =>
      Object.fromEntries(blueprint.fields.map((field) => [field.key, current[field.key] ?? ''])),
    )
  }, [blueprint.fields, workflowName])

  useEffect(() => {
    if (!open || !workflowName) return
    setOwnerUserId('')
    setWatchingDepartments(defaultWatchingDepartments)
  }, [defaultWatchingDepartments, open, workflowName])

  const createMutation = useMutation({
    mutationFn: workflowsService.createInstance,
    onSuccess: () => {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setFieldValues({})
      setOwnerUserId('')
      setWatchingDepartments([])
      setFormError(null)
      onOpenChange(false)
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tasks'] }),
        queryClient.invalidateQueries({ queryKey: ['queue'] }),
      ])
    },
    onError: () => {
      setFormError('Failed to create request. Please try again.')
    },
  })

  function updateFieldValue(key: string, value: string) {
    setFieldValues((current) => ({ ...current, [key]: value }))
  }

  function renderWorkflowField(field: (typeof blueprint.fields)[number]) {
    const value = fieldValues[field.key] ?? ''

    if (field.kind === 'select') {
      return (
        <div key={field.key} className={cn('space-y-2', field.wide && 'md:col-span-2')}>
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Select value={value} onValueChange={(nextValue) => updateFieldValue(field.key, nextValue)}>
            <SelectTrigger id={field.key}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    if (field.kind === 'date') {
      return (
        <div key={field.key} className={cn('space-y-2', field.wide && 'md:col-span-2')}>
          <Label htmlFor={field.key}>
            {field.label}
            {field.required && <span className="ml-1 text-destructive">*</span>}
          </Label>
          <Input
            id={field.key}
            type="date"
            value={value}
            onChange={(event) => updateFieldValue(field.key, event.target.value)}
            className="block w-full"
          />
        </div>
      )
    }

    const sharedProps = {
      id: field.key,
      placeholder: field.placeholder,
      value,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateFieldValue(field.key, event.target.value),
    }

    return (
      <div key={field.key} className={cn('space-y-2', field.wide && 'md:col-span-2')}>
        <Label htmlFor={field.key}>
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {field.kind === 'textarea' ? <Textarea {...sharedProps} /> : <Input {...sharedProps} />}
      </div>
    )
  }

  function submit() {
    if (!workflowName) {
      setFormError('Select a workflow template.')
      return
    }
    if (!selectedWorkflow) {
      setFormError('This workflow is not available in the current backend environment yet.')
      return
    }
    if (!title.trim()) {
      setFormError('Request title is required.')
      return
    }

    for (const field of blueprint.fields) {
      if (field.required && !fieldValues[field.key]?.trim()) {
        setFormError(`${field.label} is required.`)
        return
      }
    }

    setFormError(null)

    createMutation.mutate({
      workflowId: selectedWorkflow.id,
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      priority,
      ownerDepartment: ownerDepartment || undefined,
      ownerUserId: ownerUserId || undefined,
      watchingDepartments,
      metadata: Object.fromEntries(
        Object.entries(fieldValues).filter(([, value]) => value.trim().length > 0),
      ),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
          <DialogTitle className="text-base font-semibold">Create New Request</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  value={department}
                  onValueChange={(value) => {
                    setDepartment(value)
                    setWorkflowName('')
                  }}
                >
                  <SelectTrigger id="department">
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

              <div className="space-y-2">
                <Label htmlFor="workflow">Workflow Template</Label>
                <Select value={workflowName} onValueChange={setWorkflowName}>
                  <SelectTrigger id="workflow">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWorkflows.length > 0 ? (
                      availableWorkflows.map((workflow) => (
                        <SelectItem key={workflow.name} value={workflow.name}>
                          {workflow.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        No workflows match this department.
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {workflowName ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="owner-department">Owner Department</Label>
                    <Input id="owner-department" value={ownerDepartment || 'Unassigned'} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="owner-user">
                      Owner User <span className="font-normal text-muted-foreground">(optional)</span>
                    </Label>
                    <Select
                      value={ownerUserId || 'unassigned'}
                      onValueChange={(value) => setOwnerUserId(value === 'unassigned' ? '' : value)}
                      disabled={!ownerDepartment || directoryQuery.isLoading}
                    >
                      <SelectTrigger id="owner-user">
                        <SelectValue
                          placeholder={
                            ownerDepartment
                              ? 'Assign a person in this department'
                              : 'Select a department first'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Leave unassigned</SelectItem>
                        {(directoryQuery.data ?? []).map((candidate) => (
                          <SelectItem key={candidate.id} value={candidate.id}>
                            {candidate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {defaultWatchingDepartments.length > 0 ? (
                  <div className="space-y-2">
                    <Label>Watching Departments</Label>
                    <div className="flex flex-wrap gap-2">
                      {defaultWatchingDepartments.map((candidateDepartment) => {
                        const selected = watchingDepartments.includes(candidateDepartment)
                        return (
                          <button
                            key={candidateDepartment}
                            type="button"
                            onClick={() =>
                              setWatchingDepartments((current) =>
                                selected
                                  ? current.filter((item) => item !== candidateDepartment)
                                  : [...current, candidateDepartment],
                              )
                            }
                            className={cn(
                              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                              selected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                            )}
                          >
                            {candidateDepartment}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Watching departments can follow progress without owning the request.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="request-title">Title</Label>
                  <Input
                    id="request-title"
                    placeholder="Summarize the issue"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="request-description">
                    Context <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Textarea
                    id="request-description"
                    placeholder="Add the minimum context a reviewer needs to act."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>

                {blueprint.fields.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {blueprint.fields.map((field) => renderWorkflowField(field))}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : null}

            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2 border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!workflowName || !isWorkflowAvailable || createMutation.isPending}>
            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
