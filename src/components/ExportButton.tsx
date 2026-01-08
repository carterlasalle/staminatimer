'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
    DropdownMenuSubContent,
  DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generatePDF } from '@/lib/export/pdf'
import { generateShareableLink } from '@/lib/export/share'
import { supabase } from '@/lib/supabase/client'
import { Clock, Copy, FileDown, Share2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

type ShareDuration = '1h' | '24h' | '7d' | '30d' | 'infinite'

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleExportPDF = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          edge_events (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      await generatePDF(sessions)
      toast.success('PDF exported successfully')
    } catch (error) {
      toast.error('Failed to export PDF')
      console.error('Export error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async (duration: ShareDuration): Promise<void> => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: sessions, error } = await supabase
        .from('sessions')
        .select(`
          *,
          edge_events (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      const shareableLink = await generateShareableLink(sessions, duration)
      await navigator.clipboard.writeText(shareableLink)
      toast.success('Share link copied to clipboard')
    } catch (error) {
      toast.error('Failed to generate share link')
      console.error('Share error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Copy className="mr-2 h-4 w-4" />
            Share Link
            <Clock className="ml-2 h-4 w-4" />
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => handleShare('1h')}>
              1 Hour
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('24h')}>
              24 Hours
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('7d')}>
              7 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('30d')}>
              30 Days
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleShare('infinite')}>
              Never Expires
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isLoading}>
          <FileDown className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 