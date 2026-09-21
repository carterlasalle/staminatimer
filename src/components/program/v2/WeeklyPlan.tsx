'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getMondayFirstDayIndex,
  getSessionPrescription,
  WEEKLY_PLAN,
} from '@/lib/program/protocol-v2'
import { cn } from '@/lib/utils'

type WeeklyPlanProps = {
  today?: Date
}

/**
 * The weekly prescription. Missing a day never builds a backlog: the plan is a
 * calendar, not a debt.
 */
export function WeeklyPlan({ today = new Date() }: WeeklyPlanProps) {
  const todayIndex = getMondayFirstDayIndex(today)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Plan</CardTitle>
        <p className="text-sm text-muted-foreground">
          Miss a day and you simply continue with the next scheduled day. Extra sessions can be
          logged but only one training session per day can count toward progression.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {WEEKLY_PLAN.map((entry, index) => {
          const prescription = getSessionPrescription(entry.sessionType)
          const isToday = index === todayIndex

          return (
            <div
              key={entry.day}
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2',
                isToday && 'border-primary/40 bg-primary/5'
              )}
            >
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', isToday && 'text-primary')}>
                  {entry.day}
                </span>
                {isToday && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                    Today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{prescription.label}</span>
                {entry.optional && <span className="text-xs text-muted-foreground">optional</span>}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
