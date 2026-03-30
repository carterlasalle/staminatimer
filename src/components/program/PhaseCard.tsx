'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type PhaseCardProps = {
  phase: number
  title: string
  summary: string
  goal: string
  isCurrent: boolean
  isCompleted: boolean
}

export function PhaseCard({
  phase,
  title,
  summary,
  goal,
  isCurrent,
  isCompleted,
}: PhaseCardProps) {
  return (
    <Card
      className={cn(
        'transition-colors',
        isCurrent && 'border-primary/40 bg-primary/5',
        isCompleted && 'border-emerald-500/30'
      )}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant={isCurrent ? 'default' : 'secondary'}>Phase {phase}</Badge>
          {isCompleted && (
            <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/15">
              Complete
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{summary}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Goal:</span> {goal}
        </p>
      </CardContent>
    </Card>
  )
}
