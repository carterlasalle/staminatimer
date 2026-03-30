'use client'

export const dynamic = 'force-dynamic'

import { ProgramDashboard } from '@/components/program/ProgramDashboard'
import { AppNavigation } from '@/components/AppNavigation'

export default function ProgramPage() {
  return (
    <AppNavigation>
      <ProgramDashboard />
    </AppNavigation>
  )
}
