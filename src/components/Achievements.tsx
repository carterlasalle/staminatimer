'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import type { UserAchievement } from '@/lib/types/achievements'
import { Shield, Star, TrendingUp, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

export function Achievements(): JSX.Element {
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAchievements(): Promise<void> {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user?.id)

      if (error) {
        console.error('Error fetching achievements:', error)
        return
      }

      setAchievements(data)
      setLoading(false)
    }

    fetchAchievements()
  }, [])

  if (loading) return <div>Loading achievements...</div>

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Achievements</CardTitle>
        <CardDescription>Track your progress and unlock rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="endurance">
          <TabsList>
            <TabsTrigger value="endurance">
              <Trophy className="w-4 h-4 mr-2" />
              Endurance
            </TabsTrigger>
            <TabsTrigger value="control">
              <Shield className="w-4 h-4 mr-2" />
              Control
            </TabsTrigger>
            <TabsTrigger value="progress">
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="special">
              <Star className="w-4 h-4 mr-2" />
              Special
            </TabsTrigger>
          </TabsList>

          {['endurance', 'control', 'progress', 'special'].map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements
                  .filter(a => a.achievement.category === category)
                  .map(userAchievement => (
                    <AchievementCard
                      key={userAchievement.id}
                      userAchievement={userAchievement}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function AchievementCard({ userAchievement }: { userAchievement: UserAchievement }): JSX.Element {
  const { achievement, progress, unlocked_at } = userAchievement
  const unlocked = progress === 100

  return (
    <Card className={`${unlocked ? 'bg-gradient-to-br from-green-900 to-green-800' : 'bg-card'}`}>
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className={`rounded-full p-3 ${unlocked ? 'bg-green-500' : 'bg-secondary'}`}>
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <CardTitle>{achievement.name}</CardTitle>
            <CardDescription>{achievement.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!unlocked && (
          <div className="mt-4">
            <div className="text-sm text-muted-foreground mb-1">
              Progress: {progress}%
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {unlocked && (
          <div className="text-sm text-muted-foreground mt-4">
            Unlocked on {new Date(unlocked_at).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 