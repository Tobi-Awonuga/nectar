import { useEffect, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getWorkflowBlueprint,
  matchesDepartment,
  workflowCatalog,
  workflowDepartments,
} from '@/config/workflowBlueprints'
import type { Workflow } from '@/types/domain.types'
import { workflowsService } from '@/services/workflows.service'
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

  useEffect(() => {
    if (open) {
      setWorkflowName(initialWorkflowName ?? '')
      if (initialWorkflowName) {
        setDepartment(getWorkflowBlueprint(initialWorkflowName).departments[0] ?? initialDepartment ?? 'All Departments')
      } else if (initialDepartment) {
        setDepartment(initialDepartment)
      } else {
        setDepartment('All Departments')
      }
    }
  }, [initialDepartment, initialWorkflowName, open])

  const availableWorkflows = workflowCatalog.filter((workflow) => matchesDepartment(workflow.name, department))
  const selectedWorkflow = workflowByName.get(workflowName)
  const blueprint = getWorkflowBlueprint(workflowName)
  const isWorkflowAvailable = Boolean(selectedWorkflow)

  useEffect(() => {
    setFieldValues((current) =>
      Object.fromEntries(
        blueprint.fields.map((field) => [field.key, current[field.key] ?? '']),
      ),
    )
  }, [workflowName, blueprint.fields])

  const createMutation = useMutation({
    mutationFn: workflowsService.createInstance,
    onSuccess: () => {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setFieldValues({})
      setFormError(null)
      onOpenChange(false)
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
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
          <Label htmlFor={field.key}>{field.label}</Label>
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

    const sharedProps = {
      id: field.key,
      placeholder: field.placeholder,
      value,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateFieldValue(field.key, event.target.value),
    }

    return (
      <div key={field.key} className={cn('space-y-2', field.wide && 'md:col-span-2')}>
        <Label htmlFor={field.key}>{field.label}</Label>
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
      metadata: Object.fromEntries(
        Object.entries(fieldValues).filter(([, value]) => value.trim().length > 0),
      ),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-muted/20 px-6 py-5">
          <DialogTitle>Create New Request</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-146px)] overflow-y-auto px-6 py-5">
          <div className="space-y-6">
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
                    Context{' '}
                    <span className="text-muted-foreground font-normal">(optional)</span>
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

        <DialogFooter className="border-t border-border bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!workflowName || !isWorkflowAvailable || createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
