import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  color?: string
  className?: string
}

const colorMap: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
}

export function StatusBadge({ label, color = 'slate', className }: StatusBadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', colorMap[color] ?? colorMap.slate, className)}>
      {label}
    </span>
  )
}
