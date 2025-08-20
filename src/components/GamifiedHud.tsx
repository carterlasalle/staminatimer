'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Flame, Target, Trophy, Star, Crown, Award, Minus, Plus, Calendar, Clock } from 'lucide-react'
import { usePreferences } from '@/hooks/usePreferences'
import { useGlobal } from '@/contexts/GlobalContext'
import { useGamification } from '@/hooks/useGamification'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'

export function GamifiedHud(): JSX.Element {
  const { prefs, setDailyGoalMinutes } = usePreferences()
  const { recentSessions } = useGlobal()
  const { points, level, streakCount, userAchievements } = useGamification()
  const [showLevelUpAnimation, setShowLevelUpAnimation] = useState(false)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  const todayMs = recentSessions
    .filter((s) => {
      const t = new Date(s.created_at)
      return t >= today && t < tomorrow
    })
    .reduce((acc, s) => acc + (s.total_duration || 0), 0)

  const goalMs = prefs.dailyGoalMinutes * 60 * 1000
  const goalPct = Math.min(100, Math.round((todayMs / goalMs) * 100))
  const unlockedAchievements = userAchievements.filter((a) => a.progress === 100).length
  const totalAchievements = userAchievements.length

  // Level up animation trigger
  useEffect(() => {
    if (level.progressPct === 0 && level.level > 1) {
      setShowLevelUpAnimation(true)
      const timeout = setTimeout(() => setShowLevelUpAnimation(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [level.level, level.progressPct])

  const getLevelIcon = () => {
    if (level.level >= 20) return <Crown className="h-6 w-6 text-purple-400" />
    if (level.level >= 10) return <Award className="h-6 w-6 text-blue-400" />
    return <Star className="h-6 w-6 text-yellow-400" />
  }

  const getStreakColor = () => {
    if (streakCount >= 10) return 'text-purple-500'
    if (streakCount >= 5) return 'text-orange-500'
    return 'text-orange-400'
  }

  const getGoalStatus = () => {
    if (goalPct >= 100) return { color: 'text-green-500', bg: 'bg-green-500', message: 'Goal Achieved! 🎉' }
    if (goalPct >= 75) return { color: 'text-blue-500', bg: 'bg-blue-500', message: 'Almost there!' }
    if (goalPct >= 50) return { color: 'text-yellow-500', bg: 'bg-yellow-500', message: 'Halfway there!' }
    return { color: 'text-gray-500', bg: 'bg-gray-500', message: 'Keep going!' }
  }

  const goalStatus = getGoalStatus()

  return (
    <div className="space-y-6">
      {/* Level Up Animation */}
      {showLevelUpAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
          <div className="bg-card p-8 rounded-2xl border border-yellow-400/50 shadow-2xl animate-bounce">
            <div className="text-center space-y-4">
              <Crown className="h-16 w-16 text-yellow-400 mx-auto animate-pulse" />
              <h2 className="text-3xl font-bold text-yellow-400">LEVEL UP!</h2>
              <p className="text-xl">You've reached Level {level.level}!</p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Level Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-yellow-500/5" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {getLevelIcon()}
                <div>
                  <div className="font-bold text-lg">Level {level.level}</div>
                  <div className="text-xs text-muted-foreground">Control Master</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-yellow-400">{points} XP</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
            </div>
            <div className="space-y-2">
              <Progress 
                value={level.progressPct} 
                className="h-2 bg-yellow-100 dark:bg-yellow-900/20"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{level.currentLevelXp} XP</span>
                <span>{100 - level.currentLevelXp} to level {level.level + 1}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Flame className={cn("h-6 w-6", getStreakColor())} />
                <div>
                  <div className="font-bold text-lg">Streak</div>
                  <div className="text-xs text-muted-foreground">Practice Days</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("text-2xl font-bold", getStreakColor())}>
                  {streakCount}
                </div>
                <div className="text-xs text-muted-foreground">🔥 Days</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              {streakCount > 0 ? 'Keep the momentum going!' : 'Start your streak today!'}
            </div>
          </CardContent>
        </Card>

        {/* Daily Goal Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-blue-500/5" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="font-bold text-lg">Daily Goal</div>
                  <div className="text-xs text-muted-foreground">{prefs.dailyGoalMinutes} minutes</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn("text-lg font-bold", goalStatus.color)}>
                  {goalPct}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
            <div className="space-y-2">
              <Progress 
                value={goalPct} 
                className="h-2"
              />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(todayMs)}
                </span>
                <span className={goalStatus.color}>{goalStatus.message}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setDailyGoalMinutes(Math.max(5, prefs.dailyGoalMinutes - 5))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setDailyGoalMinutes(prefs.dailyGoalMinutes + 5)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Card */}
        <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-green-500/5" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-green-500" />
                <div>
                  <div className="font-bold text-lg">Trophies</div>
                  <div className="text-xs text-muted-foreground">Achievements</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-500">
                  {unlockedAchievements}/{totalAchievements}
                </div>
                <div className="text-xs text-muted-foreground">Unlocked</div>
              </div>
            </div>
            <div className="space-y-2">
              <Progress 
                value={(unlockedAchievements / totalAchievements) * 100} 
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {totalAchievements - unlockedAchievements} achievements remaining
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress Summary */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <CardContent className="pt-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-primary" />
              <div>
                <h3 className="font-bold text-lg">Today's Progress</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatDuration(todayMs)}</div>
              <div className="text-sm text-muted-foreground">Total Practice</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold">{recentSessions.filter(s => {
                const t = new Date(s.created_at)
                return t >= today && t < tomorrow
              }).length}</div>
              <div className="text-xs text-muted-foreground">Sessions</div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold">{level.level}</div>
              <div className="text-xs text-muted-foreground">Level</div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold">{streakCount}</div>
              <div className="text-xs text-muted-foreground">Streak</div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-2xl font-bold">{unlockedAchievements}</div>
              <div className="text-xs text-muted-foreground">Trophies</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

