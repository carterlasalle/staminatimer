import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
  fullScreen?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export function Loading({ className, size = 'md', text, fullScreen }: LoadingProps) {
  const Wrapper = fullScreen ? FullScreenWrapper : DefaultWrapper
  
  return (
    <Wrapper>
      <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
        <Loader2 className={cn('animate-spin text-primary', sizeMap[size])} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </Wrapper>
  )
}

function FullScreenWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      {children}
    </div>
  )
}

function DefaultWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center p-4">{children}</div>
} 