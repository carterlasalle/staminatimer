import { AppNavigation } from '@/components/AppNavigation'
import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { SessionHistory } from '@/components/SessionHistory'
import { Achievements } from '@/components/Achievements'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ExportButton'
import { 
  BarChart3, 
  Calendar, 
  Award, 
  TrendingUp,
  Clock,
  Target,
  Activity,
  Download
} from 'lucide-react'

export default function AnalyticsPage(): JSX.Element {
  return (
    <AppNavigation>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Progress & Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into your training progress and performance trends.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton />
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <ErrorBoundary>
                  <Analytics />
                </ErrorBoundary>
              </div>
              <div className="space-y-6">
                <ErrorBoundary>
                  <Charts />
                </ErrorBoundary>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">156</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">24h 32m</div>
                  <div className="text-sm text-muted-foreground">Total Practice Time</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">9.4m</div>
                  <div className="text-sm text-muted-foreground">Average Session</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">28</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <ErrorBoundary>
              <SessionHistory />
            </ErrorBoundary>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Session Duration</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-500">+15%</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Edge Control</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-500">+8%</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Session Frequency</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-500">+22%</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm">Sessions this week</span>
                      <span className="font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total practice time</span>
                      <span className="font-medium">2h 18m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average session</span>
                      <span className="font-medium">11.5m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Best session</span>
                      <span className="font-medium">18m 34s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <ErrorBoundary>
              <Charts />
            </ErrorBoundary>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <ErrorBoundary>
              <Achievements />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </AppNavigation>
  )
}