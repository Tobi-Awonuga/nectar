import { useQuery } from '@tanstack/react-query'
import { Lock, Inbox } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { apiClient } from '@/services/api.client'
import type { WorkflowInstance } from '@/types/domain.types'

async function getPrivateRequests(): Promise<WorkflowInstance[]> {
  const { data } = await apiClient.get<{ data: WorkflowInstance[] }>('/tasks/private')
  return data.data
}

export default function InboxPage() {
  const query = useQuery({ queryKey: ['private-requests'], queryFn: getPrivateRequests })

  return (
    <div className="space-y-6">
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
                <Lock size={13} className="mt-0.5 shrink-0 text-muted-foreground/40" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
