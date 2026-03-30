'use client'

export const dynamic = 'force-dynamic'

import { ActiveSession } from '@/components/program/ActiveSession'
import { AppNavigation } from '@/components/AppNavigation'

export default function ProgramSessionPage() {
  return (
    <AppNavigation>
      <ActiveSession />
    </AppNavigation>
  )
}
