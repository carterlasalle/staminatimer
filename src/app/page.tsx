import { Timer } from '@/components/Timer'
import { SessionHistory } from '@/components/SessionHistory'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 max-w-7xl mx-auto">
      <Timer />
      <Analytics />
      <Charts />
      <SessionHistory />
    </main>
  )
}
