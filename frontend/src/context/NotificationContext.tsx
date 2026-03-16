import { createContext, useContext, useState, ReactNode } from 'react'

interface NotificationContextValue {
  unreadCount: number
  refetch: () => void
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refetch: () => {},
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount] = useState(0)
  // TODO: poll or websocket for real-time unread count
  return (
    <NotificationContext.Provider value={{ unreadCount, refetch: () => {} }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotificationContext() {
  return useContext(NotificationContext)
}
