import { createBrowserRouter } from 'react-router-dom'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import WorkflowsPage from './pages/workflows/WorkflowsPage'
import WorkflowDetailPage from './pages/workflows/WorkflowDetailPage'
import TasksPage from './pages/tasks/TasksPage'
import ApprovalsPage from './pages/approvals/ApprovalsPage'
import AuditLogPage from './pages/audit/AuditLogPage'
import AdminPage from './pages/admin/AdminPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    // TODO: wrap with AuthGuard layout component
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'workflows', element: <WorkflowsPage /> },
      { path: 'workflows/:id', element: <WorkflowDetailPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'approvals', element: <ApprovalsPage /> },
      { path: 'audit', element: <AuditLogPage /> },
      { path: 'admin', element: <AdminPage /> },
    ],
  },
])
