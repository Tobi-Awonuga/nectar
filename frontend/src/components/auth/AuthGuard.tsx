import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { LoadingSpinner } from '../shared/LoadingSpinner'

export function AuthGuard() {
  const { user, isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // New user hasn't filled in their profile yet
  if (user?.onboardingStatus === 'pending_onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // User submitted onboarding, waiting for admin approval
  if (user?.onboardingStatus === 'pending_approval' || user?.onboardingStatus === 'rejected') {
    return <Navigate to="/pending-approval" replace />
  }

  return <Outlet />
}
