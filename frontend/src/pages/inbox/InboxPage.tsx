import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Lock, Inbox, Plus, ArrowUpRight, X } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { workflowsService } from '@/services/workflows.service'
import { usersService } from '@/services/users.service'
import type { WorkflowInstance } from '@/types/domain.types'

async function getPrivateRequests(): Promise<WorkflowInstance[]> {
  const { data } = await (await import('@/services/api.client')).apiClient
    .get<{ data: WorkflowInstance[] }>('/tasks/private')
  return data.data
}

export default function InboxPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [recipientId, setRecipientId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['private-requests'], queryFn: getPrivateRequests })

  const workflowsQuery = useQuery({
    queryKey: ['workflows'],
    queryFn: workflowsService.getWorkflows,
  })

  const usersQuery = useQuery({
    queryKey: ['all-users-directory'],
    queryFn: () => usersService.getDirectory(),
    enabled: showForm,
  })

  const openWorkflow = workflowsQuery.data?.find((w) => w.name === 'Open Request')

  const sendMutation = useMutation({
    mutationFn: () => {
      if (!openWorkflow) throw new Error('Open Request workflow not available')
      return workflowsService.createInstance({
        workflowId: openWorkflow.id,
        title: title.trim(),
        description: description.trim() || undefined,
        visibility: 'private',
        privateRecipientId: recipientId,
      })
    },
    onSuccess: () => {
      setShowForm(false)
      setRecipientId('')
      setTitle('')
      setDescription('')
      setFormError(null)
      void queryClient.invalidateQueries({ queryKey: ['private-requests'] })
    },
    onError: () => setFormError('Failed to send request. Try again.'),
  })

  function submit() {
    if (!recipientId) { setFormError('Select a recipient.'); return }
    if (!title.trim()) { setFormError('Title is required.'); return }
    if (!openWorkflow) { setFormError('Open Request workflow is not set up yet — restart the server.'); return }
    setFormError(null)
    sendMutation.mutate()
  }

  function cancelForm() {
    setShowForm(false)
    setRecipientId('')
    setTitle('')
    setDescription('')
    setFormError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-foreground">Inbox</h2>
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border">
              <Lock size={10} />
              Private
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Direct requests sent to you or by you. Only you and the other party can see these.
          </p>
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)} className="shrink-0">
            <Plus size={14} />
            New Direct Request
          </Button>
        )}
      </div>

      {/* New request form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-foreground">New Direct Request</p>
            <button onClick={cancelForm} className="text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="recipient">Send to</Label>
              <Select value={recipientId} onValueChange={setRecipientId} disabled={usersQuery.isLoading}>
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {(usersQuery.data ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inbox-title">Title</Label>
              <Input
                id="inbox-title"
                placeholder="What do you need?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inbox-desc">
              Details <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="inbox-desc"
              placeholder="Add any context the recipient needs to act."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none min-h-[80px]"
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={cancelForm} disabled={sendMutation.isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? <LoadingSpinner className="h-3 w-3 mr-1.5" /> : null}
              Send Request
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {query.isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <LoadingSpinner className="h-6 w-6" />
        </div>
      ) : query.isError ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-6 py-8 text-center">
          <p className="text-sm font-medium text-destructive">Unable to load inbox</p>
        </div>
      ) : (query.data ?? []).length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
          <Inbox size={32} className="mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-sm font-semibold text-foreground">No private requests</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Private requests sent directly to you will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(query.data ?? []).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm shadow-black/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-foreground">{item.title}</p>
                    <StatusBadge label={item.priority} color="slate" className="text-[10px] capitalize" />
                  </div>
                  {item.description && (
                    <p className="mt-1 text-[12px] text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Lock size={12} className="text-muted-foreground/40" />
                  <Link
                    to={`/requests/${item.id}`}
                    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <ArrowUpRight size={12} />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
