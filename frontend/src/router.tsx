import { createBrowserRouter } from 'react-router-dom'
import { AuthGuard } from './components/auth/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/auth/LoginPage'
import OnboardingPage from './pages/auth/OnboardingPage'
import PendingApprovalPage from './pages/auth/PendingApprovalPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import WorkflowsPage from './pages/workflows/WorkflowsPage'
import WorkflowDetailPage from './pages/workflows/WorkflowDetailPage'
import TasksPage from './pages/tasks/TasksPage'
import ApprovalsPage from './pages/approvals/ApprovalsPage'
import AuditLogPage from './pages/audit/AuditLogPage'
import AdminPage from './pages/admin/AdminPage'
import QueuePage from './pages/queue/QueuePage'
import InboxPage from './pages/inbox/InboxPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/pending-approval',
    element: <PendingApprovalPage />,
  },
  {
    // AuthGuard checks authentication — renders <Outlet /> or redirects to /login
    element: <AuthGuard />,
    children: [
      {
        // AppShell renders sidebar, header, and <Outlet /> for page content
        element: <AppShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/workflows', element: <WorkflowsPage /> },
          { path: '/workflows/:id', element: <WorkflowDetailPage /> },
          { path: '/tasks', element: <TasksPage /> },
          { path: '/approvals', element: <ApprovalsPage /> },
          { path: '/audit', element: <AuditLogPage /> },
          { path: '/admin', element: <AdminPage /> },
          { path: '/queue', element: <QueuePage /> },
          { path: '/inbox', element: <InboxPage /> },
        ],
      },
    ],
  },
])
