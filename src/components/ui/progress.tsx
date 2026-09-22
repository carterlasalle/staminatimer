'use client'

import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'

import { cn } from '@/lib/utils'

const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    /**
     * Accessible name for the bar. Radix renders `role="progressbar"`, and a
     * progressbar with no name tells a screen-reader user nothing — axe flags it
     * as serious. Always pass this.
     */
    label?: string
  }
>(({ className, value, label, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    aria-label={label}
    className={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-[color,background-color,border-color,box-shadow,transform]"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))

Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
