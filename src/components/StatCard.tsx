'use client'

import { useGlobalStats } from '@/hooks/useGlobalStats'

interface StatCardProps {
  number: string
  label: string
}

export function StatCard({ number, label }: StatCardProps) {
  const { stats, loading } = useGlobalStats()
  
  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`
    return n.toString()
  }

  const getDisplayNumber = () => {
    if (loading) return '...'
    if (!stats) return number
    
    switch (label) {
      case 'Active Users':
        return formatNumber(stats.active_users_count)
      case 'Sessions Tracked':
        return formatNumber(stats.total_sessions_count)
      default:
        return number
    }
  }

  return (
    <div className="p-6 rounded-lg bg-card border">
      <div className="text-3xl font-bold text-primary mb-2">
        {getDisplayNumber()}
      </div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
} 