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
      <CardContent>
        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60">
          {WEEKLY_PLAN.map((entry, index) => {
            const prescription = getSessionPrescription(entry.sessionType)
            const isToday = index === todayIndex

            return (
              <li
                key={entry.day}
                className={cn(
                  'flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5',
                  isToday && 'bg-primary/10'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'text-sm',
                      isToday ? 'font-medium text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {entry.day}
                  </span>
                  {isToday && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wider text-primary">
                      Today
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn('text-sm', isToday ? 'text-foreground' : 'text-foreground/85')}
                  >
                    {prescription.label}
                  </span>
                  {entry.optional && (
                    <span className="text-xs text-muted-foreground">optional</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
