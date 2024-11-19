'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, FileDown, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { generatePDF } from '@/lib/export/pdf'
import { generateShareableLink } from '@/lib/export/share'

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleExportPDF = async () => {
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

  const handleShare = async () => {
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

      const shareableLink = await generateShareableLink(sessions)
      await navigator.clipboard.writeText(shareableLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
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
        <DropdownMenuItem onClick={handleShare} disabled={isLoading}>
          {copied ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Share Link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF} disabled={isLoading}>
          <FileDown className="mr-2 h-4 w-4" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 