// Force dynamic rendering for this page - prevents static generation
// which would fail without NEXT_PUBLIC_GEMINI_API_KEY at build time
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { AICoachChat } from '@/components/AICoachChat'

export default function AICoachPage(): JSX.Element {
  return (
    <AppNavigation>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <AICoachChat />
      </div>
    </AppNavigation>
  )
}