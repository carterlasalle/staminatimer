'use client'

import { useGlobalStats } from '@/hooks/useGlobalStats'
import { Loader2 } from 'lucide-react'

type StatCardProps = {
  number: string // Default/placeholder number
  label: string // Stat label
}

export function StatCard({ number, label }: StatCardProps): JSX.Element {
  const { stats, loading } = useGlobalStats()
  
  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M+`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`
    return n.toString()
  }

  const getDisplayNumber = (): string => {
    if (loading) return '-'
    if (!stats) return number
    
    switch (label) {
      case 'Active Users':
        return formatNumber(stats.active_users_count)
      case 'Sessions Tracked':
        return formatNumber(stats.total_sessions_count)
      default:
        // If the label doesn't match a known stat, use the provided number
        // This allows for static stats like "Achievements to Unlock"
        return number
    }
  }

  return (
    <div className="p-6 rounded-lg bg-card border">
      <div className="text-3xl font-bold text-primary mb-2">
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin inline-block text-muted-foreground" />
        ) : (
          getDisplayNumber()
        )}
      </div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  )
}