'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import type { Achievement, UserAchievement } from '@/lib/types/achievements'
import { Shield, Star, TrendingUp, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useGamification } from '@/hooks/useGamification'

export function Achievements() {
  const [all, setAll] = useState<Achievement[]>([])
  const [user, setUser] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const { points, level } = useGamification()

  useEffect(() => {
    async function fetchAchievements(): Promise<void> { 
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
         setAll([])
         setUser([])
         setLoading(false);
         return; 
      }
      
      const [{ data: defs }, { data: mine, error } ] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase
          .from('user_achievements')
          .select(`*, achievement:achievements(*)`)
          .eq('user_id', user.id)
      ])

      if (error) {
        console.error('Error fetching achievements:', error)
      } else {
        setAll((defs as Achievement[]) || [])
        setUser((mine as UserAchievement[]) || [])
      }
      setLoading(false)
    }

    fetchAchievements()
  }, [])

  if (loading) return <div>Loading achievements...</div>

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Achievements</CardTitle>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="font-semibold text-primary">{level.level}</div>
            <div className="text-muted-foreground">Level</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-500">{user.filter(u => u.progress === 100).length}</div>
            <div className="text-muted-foreground">Unlocked</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-yellow-500">{points}</div>
            <div className="text-muted-foreground">XP</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="endurance">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="endurance" className="text-xs px-1">
              <Trophy className="w-3 h-3 mr-1" />
              End
            </TabsTrigger>
            <TabsTrigger value="control" className="text-xs px-1">
              <Shield className="w-3 h-3 mr-1" />
              Ctrl
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs px-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              Prog
            </TabsTrigger>
            <TabsTrigger value="special" className="text-xs px-1">
              <Star className="w-3 h-3 mr-1" />
              Spec
            </TabsTrigger>
          </TabsList>

          {(['endurance', 'control', 'progress', 'special'] as const).map(category => (
            <TabsContent key={category} value={category} className="mt-3">
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {mergeAllWithUser(all, user)
                  .filter(a => a.achievement.category === category)
                  .slice(0, 6) // Limit to 6 most relevant achievements
                  .map(u => (
                    <AchievementCard key={u.achievement.id} userAchievement={u} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

function AchievementCard({ userAchievement }: { userAchievement: UserAchievement }) {
  const { achievement, progress, unlocked_at } = userAchievement
  const unlocked = progress === 100

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
      unlocked 
        ? 'bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20' 
        : 'bg-secondary/30 border-border hover:bg-secondary/50'
    }`}>
      <div className={`rounded-full p-2 flex-shrink-0 ${
        unlocked ? 'bg-green-500/20' : 'bg-secondary'
      }`}>
        <Trophy className={`w-4 h-4 ${unlocked ? 'text-green-400' : 'text-muted-foreground'}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-medium truncate ${unlocked ? 'text-green-400' : 'text-foreground'}`}>
            {achievement.name}
          </h4>
          {unlocked && (
            <div className="text-xs text-green-400 font-medium ml-2">✓</div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {achievement.description}
        </p>
        
        {!unlocked && progress > 0 && (
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
        
        {unlocked && unlocked_at && (
          <div className="text-xs text-muted-foreground mt-1">
            {new Date(unlocked_at).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  )
}

function mergeAllWithUser(all: Achievement[], user: UserAchievement[]): UserAchievement[] {
  const byId = new Map(user.map(u => [u.achievement_id, u]))
  return all.map(a => {
    const existing = byId.get(a.id)
    if (existing) return existing
    return {
      id: a.id,
      user_id: '',
      achievement_id: a.id,
      unlocked_at: '',
      progress: 0,
      achievement: a
    } as UserAchievement
  })
}
