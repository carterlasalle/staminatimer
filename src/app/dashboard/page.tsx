import { Achievements } from '@/components/Achievements'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ExportButton } from '@/components/ExportButton'
import { ModeToggle } from '@/components/mode-toggle'
import { SessionHistory } from '@/components/SessionHistory'
import { Timer } from '@/components/Timer'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { UserMenu } from '@/components/UserMenu'

export default function Dashboard(): JSX.Element {
  return (
    <ResponsiveContainer maxWidth="2xl" padding className="py-8 md:py-12">
      <header className="flex justify-between items-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <ExportButton />
          <ModeToggle />
          <UserMenu />
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column (Timer & History) */}
        <section className="lg:col-span-2 space-y-6 md:space-y-8">
          <ErrorBoundary><Timer /></ErrorBoundary>
          <ErrorBoundary><SessionHistory /></ErrorBoundary>
        </section>

        {/* Right Column (Analytics, Charts, Achievements) */}
        <aside className="space-y-6 md:space-y-8">
          <ErrorBoundary><Analytics /></ErrorBoundary>
          <ErrorBoundary><Charts /></ErrorBoundary>
          <ErrorBoundary><Achievements /></ErrorBoundary>
        </aside>
      </main>
    </ResponsiveContainer>
  )
}