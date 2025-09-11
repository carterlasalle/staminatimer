'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { AICoachChat } from '@/components/AICoachChat'

export default function AICoachPage(): JSX.Element {
  return (
    <AppNavigation>
      <div className="max-w-6xl mx-auto p-6">
        <AICoachChat />
      </div>
    </AppNavigation>
  )
}