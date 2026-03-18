import { cn } from '@/lib/utils'

interface NectarLogoProps {
  className?: string
  markClassName?: string
  wordmarkClassName?: string
  showWordmark?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: {
    wrapper: 'gap-2.5',
    mark: 'h-8 w-8',
    wordmark: 'text-base',
  },
  md: {
    wrapper: 'gap-3',
    mark: 'h-10 w-10',
    wordmark: 'text-lg',
  },
  lg: {
    wrapper: 'gap-3.5',
    mark: 'h-12 w-12',
    wordmark: 'text-xl',
  },
}

export function NectarLogo({
  className,
  markClassName,
  wordmarkClassName,
  showWordmark = true,
  size = 'md',
}: NectarLogoProps) {
  const scale = sizeClasses[size]

  return (
    <div className={cn('flex items-center', scale.wrapper, className)}>
      <div className={cn('relative shrink-0', scale.mark, markClassName)}>
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M36.5 5.5c10.8 0 19.5 10.7 19.5 24S47.3 53.5 36.5 53.5 17 42.8 17 29.5 25.7 5.5 36.5 5.5Z"
            fill="#4F55B8"
          />
          <path
            d="M35 18c7.9 0 14.3 6.5 14.3 14.5S42.9 47 35 47s-14.3-6.5-14.3-14.5S27.1 18 35 18Z"
            fill="#3035AB"
          />
          <path
            d="m43.5 10.5 15.2 2-9.8 11.2-5.4-13.2Z"
            fill="#CB694C"
          />
          <path
            d="M14.5 33.5c1.7 7.7 6 14.4 11.8 18.8-5.8-1-10.7-3.3-14.5-6.8L14.5 33.5Z"
            fill="#4F55B8"
            fillOpacity="0.92"
          />
        </svg>
      </div>

      {showWordmark && (
        <span
          className={cn(
            'font-semibold tracking-[-0.02em] text-foreground',
            scale.wordmark,
            wordmarkClassName,
          )}
        >
          Nectar
        </span>
      )}
    </div>
  )
}
