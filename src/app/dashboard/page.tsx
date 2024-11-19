import { Timer } from '@/components/Timer'
import { SessionHistory } from '@/components/SessionHistory'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { Achievements } from '@/components/Achievements'
import { ModeToggle } from '@/components/mode-toggle'
import { UserMenu } from '@/components/UserMenu'
import { ExportButton } from '@/components/ExportButton'

export default function Dashboard() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 max-w-7xl mx-auto">
      <div className="w-full flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Stamina Timer</h1>
        <div className="flex items-center gap-4">
          <ExportButton />
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
      <Timer />
      <Analytics />
      <Charts />
      <Achievements />
      <SessionHistory />
    </main>
  )
} 