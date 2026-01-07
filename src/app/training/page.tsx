// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { AppNavigation } from '@/components/AppNavigation'
import { Timer } from '@/components/Timer'
import { Charts } from '@/components/Charts'
import { Analytics } from '@/components/Analytics'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tips } from '@/components/Tips'
import { Brain, Timer as TimerIcon, BarChart3, Lightbulb } from 'lucide-react'

export default function TrainingPage() {
  return (
    <AppNavigation>
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl md:text-2xl font-bold">Training Timer</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Build your stamina with precision tracking and detailed analytics.
          </p>
        </div>

        {/* Main Training Interface */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Timer Section */}
          <div className="xl:col-span-2 space-y-4 md:space-y-6">
            <ErrorBoundary>
              <Timer />
            </ErrorBoundary>

            {/* Session Guidance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Session Guidance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <h4 className="font-semibold text-blue-600 mb-2">Before Starting</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Find a comfortable, private space</li>
                      <li>• Take 3 deep breaths to relax</li>
                      <li>• Set a realistic time goal</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <h4 className="font-semibold text-orange-600 mb-2">During Edge</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Focus on deep breathing</li>
                      <li>• Relax pelvic muscles</li>
                      <li>• Stay mindful of sensations</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <h4 className="font-semibold text-green-600 mb-2">After Session</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Review your progress</li>
                      <li>• Note what worked well</li>
                      <li>• Plan your next session</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 md:space-y-6">
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="analytics" className="text-[11px] md:text-xs px-2">
                  <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="charts" className="text-[11px] md:text-xs px-2">
                  <TimerIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="tips" className="text-[11px] md:text-xs px-2">
                  <Lightbulb className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
                  Tips
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analytics" className="mt-4">
                <ErrorBoundary>
                  <Analytics />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="charts" className="mt-4">
                <ErrorBoundary>
                  <Charts />
                </ErrorBoundary>
              </TabsContent>

              <TabsContent value="tips" className="mt-4">
                <ErrorBoundary>
                  <Tips />
                </ErrorBoundary>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Training Programs */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Training Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <h4 className="font-semibold mb-2">Beginner Program</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  4-week program focusing on basic control and awareness
                </p>
                <div className="text-xs text-muted-foreground">
                  • 10-15 minute sessions
                  • 3-4 times per week
                  • Basic edge control
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <h4 className="font-semibold mb-2">Intermediate Program</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  6-week program for building sustained control
                </p>
                <div className="text-xs text-muted-foreground">
                  • 15-25 minute sessions
                  • 4-5 times per week
                  • Multiple edge practice
                </div>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
                <h4 className="font-semibold mb-2">Advanced Program</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  8-week program for mastering complete control
                </p>
                <div className="text-xs text-muted-foreground">
                  • 25+ minute sessions
                  • 5-6 times per week
                  • Complex techniques
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppNavigation>
  )
}