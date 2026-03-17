import { useEffect, useState, type ChangeEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkflowBlueprint } from '@/config/workflowBlueprints'
import type { Workflow } from '@/types/domain.types'
import { workflowsService } from '@/services/workflows.service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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

type Priority = 'low' | 'medium' | 'high' | 'critical'

interface StartWorkflowDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workflows: Workflow[]
  initialWorkflowId?: string
}

export function StartWorkflowDialog({
  open,
  onOpenChange,
  workflows,
  initialWorkflowId,
}: StartWorkflowDialogProps) {
  const queryClient = useQueryClient()
  const [workflowId, setWorkflowId] = useState(initialWorkflowId ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      setWorkflowId(initialWorkflowId ?? '')
    }
  }, [initialWorkflowId, open])

  const selectedWorkflow = workflows.find((workflow) => workflow.id === workflowId)
  const blueprint = getWorkflowBlueprint(selectedWorkflow)

  useEffect(() => {
    setFieldValues((current) =>
      Object.fromEntries(
        blueprint.fields.map((field) => [field.key, current[field.key] ?? '']),
      ),
    )
  }, [workflowId, blueprint.fields])

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

  function submit() {
    if (!workflowId) {
      setFormError('Select a workflow template.')
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
      workflowId,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Request</DialogTitle>
          <DialogDescription>{blueprint.summary}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workflow">Workflow Template</Label>
            <Select value={workflowId} onValueChange={setWorkflowId}>
              <SelectTrigger id="workflow">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {workflows.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-title">Request Title</Label>
            <Input
              id="request-title"
              placeholder="Summarize the business need"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="request-description">Context for Reviewers</Label>
            <Textarea
              id="request-description"
              placeholder="Add background, urgency, dependencies, or constraints."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          {blueprint.fields.map((field) => {
            const sharedProps = {
              id: field.key,
              placeholder: field.placeholder,
              value: fieldValues[field.key] ?? '',
              onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                updateFieldValue(field.key, event.target.value),
            }

            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.kind === 'textarea' ? (
                  <Textarea {...sharedProps} />
                ) : (
                  <Input {...sharedProps} />
                )}
              </div>
            )
          })}

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

          <div className="rounded-md border border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
            {blueprint.impact}
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Creating...' : 'Start Workflow'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
