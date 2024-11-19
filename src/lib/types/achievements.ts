export type AchievementCategory = 'endurance' | 'control' | 'progress' | 'special'
export type ConditionType = 'duration' | 'edge_count' | 'edge_duration' | 'streak' | 'custom'
export type ComparisonType = 'greater' | 'less' | 'equal'

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  condition_type: ConditionType
  condition_value: number
  condition_comparison: ComparisonType
  points: number
  icon: string
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: string
  progress: number
  achievement: Achievement
} 