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
import { GamifiedHud } from '@/components/GamifiedHud'
import { Tips } from '@/components/Tips'
import { Timer as TimerIcon, BarChart3, Calendar } from 'lucide-react'

export default function Dashboard(): JSX.Element {
  return (
    <ResponsiveContainer maxWidth="2xl" padding className="py-4 md:py-6">
      {/* Enhanced Header */}
      <header className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                Control Dashboard
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Build stamina and control with precision tracking and insights
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <ExportButton />
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="mt-4 p-3 bg-card/50 backdrop-blur-sm border rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <TimerIcon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Real-time Tracking</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium">Performance Analytics</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">Progress Tracking</span>
              </div>
            </div>
          </div>
        </header>

        <main className="space-y-6">
          {/* Gamification HUD */}
          <section className="animate-fade-in">
            <ErrorBoundary>
              <GamifiedHud />
            </ErrorBoundary>
          </section>

          {/* Main Content Grid - Restructured for proper sidebar placement */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left Column - Timer */}
            <section className="lg:col-span-2 space-y-4 lg:space-y-6">
              <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <ErrorBoundary>
                  <Timer />
                </ErrorBoundary>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <ErrorBoundary>
                  <Charts />
                </ErrorBoundary>
              </div>
            </section>

            {/* Right Sidebar - Analytics & Progress */}
            <aside className="lg:col-span-1 space-y-4 lg:space-y-6">
              <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <ErrorBoundary>
                  <Analytics />
                </ErrorBoundary>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <ErrorBoundary>
                  <SessionHistory />
                </ErrorBoundary>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <ErrorBoundary>
                  <Achievements />
                </ErrorBoundary>
              </div>
              
              <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <ErrorBoundary>
                  <Tips />
                </ErrorBoundary>
              </div>
            </aside>
          </div>
        </main>
        
      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border/50">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Built for personal wellness and self-improvement. 
            <span className="text-primary font-medium">Progress through practice.</span>
          </p>
        </div>
      </footer>
    </ResponsiveContainer>
  )
}
