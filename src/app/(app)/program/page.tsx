'use client'

export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { ProgramDashboardV2 } from '@/components/program/v2/ProgramDashboardV2'

export default function ProgramPage() {
  return (
    <AppNavigation>
      <ProgramDashboardV2 />
    </AppNavigation>
  )
}
