import { Clock, LogOut, CheckCircle2 } from 'lucide-react'
import { useAuthContext } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'

export default function PendingApprovalPage() {
  const { user, logout } = useAuthContext()

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <span className="text-sm font-bold text-white">N</span>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 border border-warning/20">
            <Clock size={28} className="text-warning" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Access request pending</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your request has been submitted and is waiting for approval. You'll have full access once an administrator reviews your account.
          </p>
        </div>

        {/* User info */}
        {user && (
          <div className="rounded-xl border border-border bg-card px-5 py-4 text-left space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-bold text-primary">
                {user.name?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">{user.name}</p>
                <p className="text-[12px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {user.department && (
              <p className="text-[12px] text-muted-foreground">
                Department: <span className="font-medium text-foreground">{user.department}</span>
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-4 py-3 text-left">
            <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-[12px] text-muted-foreground">
              Reach out to your supervisor or the IT/Systems team if you need urgent access.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void logout()}
          className="gap-2"
        >
          <LogOut size={13} />
          Sign out
        </Button>
      </div>
    </div>
  )
}
