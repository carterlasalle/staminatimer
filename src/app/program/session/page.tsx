'use client'

export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { SessionRunnerV2 } from '@/components/program/v2/SessionRunnerV2'

export default function ProgramSessionPage() {
  return (
    <AppNavigation>
      <SessionRunnerV2 />
    </AppNavigation>
  )
}
