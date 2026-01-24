import { cn } from '@/lib/utils'

type ResponsiveContainerProps = {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

const maxWidthMap = {
  sm: 'max-w-(--breakpoint-sm)',
  md: 'max-w-(--breakpoint-md)',
  lg: 'max-w-(--breakpoint-lg)',
  xl: 'max-w-(--breakpoint-xl)',
  '2xl': 'max-w-(--breakpoint-2xl)',
  'full': 'max-w-full'
}

export function ResponsiveContainer({ 
  children, 
  className,
  maxWidth = 'xl',
  padding = true
}: ResponsiveContainerProps) {
  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthMap[maxWidth],
      padding && 'px-4 sm:px-6 lg:px-8',
      className
    )}>
      {children}
    </div>
  )
} 