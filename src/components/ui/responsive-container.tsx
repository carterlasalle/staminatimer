import { cn } from '@/lib/utils'

type ResponsiveContainerProps = {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: boolean
}

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
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