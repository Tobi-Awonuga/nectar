import { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  children: ReactNode
}

export function PageContainer({ title, children }: PageContainerProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  )
}
