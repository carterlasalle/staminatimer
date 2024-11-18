import { Timer } from '@/components/Timer'
import { SessionHistory } from '@/components/SessionHistory'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Timer />
      <Analytics />
      <Charts />
      <SessionHistory />
    </main>
  )
}
