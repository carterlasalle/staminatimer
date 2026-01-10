'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generatePDF } from '@/lib/export/pdf'
import { supabase } from '@/lib/supabase/client'
import { FileDown, Share2, Copy } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExportPDF = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        toast.error('Please log in to export')
        return
      }

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          edge_events (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      if (!sessions || sessions.length === 0) {
        toast.error('No sessions to export. Start training to generate data!')
        return
      }

      await generatePDF(sessions)
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
      console.error('Export error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyStats = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        toast.error('Please log in to copy stats')
        return
      }

      const { data: sessions, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!sessions || sessions.length === 0) {
        toast.error('No sessions to share. Start training first!')
        return
      }

      const totalSessions = sessions.length
      const totalDuration = sessions.reduce((acc, s) => acc + (s.total_duration || 0), 0)
      const avgDuration = totalDuration / totalSessions
      const successRate = (sessions.filter(s => !s.finished_during_edge).length / totalSessions) * 100

      const formatDuration = (ms: number) => {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}m ${seconds}s`
      }

      const statsText = `📊 Stamina Timer Stats
━━━━━━━━━━━━━━━━
🏋️ Total Sessions: ${totalSessions}
⏱️ Total Time: ${formatDuration(totalDuration)}
📈 Avg Duration: ${formatDuration(avgDuration)}
✅ Success Rate: ${successRate.toFixed(1)}%
━━━━━━━━━━━━━━━━
Track your progress at staminatimer.com`

      await navigator.clipboard.writeText(statsText)
      toast.success('Stats copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy stats')
      console.error('Copy stats error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isLoading}>
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyStats} disabled={isLoading}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Stats
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isLoading}>
          <FileDown className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 