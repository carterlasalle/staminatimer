'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDuration } from '@/lib/utils'
import type { ReactNode } from 'react'

type SessionStageProps = {
  badge?: string
  title: string
  description?: string
  remainingSec?: number
  children: ReactNode
}

export function SessionStage({ badge, title, description, remainingSec, children }: SessionStageProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        {badge && (
          <p className="text-xs font-medium uppercase tracking-wider text-primary">{badge}</p>
        )}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {typeof remainingSec === 'number' && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
              {formatDuration(remainingSec * 1000)} remaining
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}
