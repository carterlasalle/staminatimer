'use client'

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import { useEffect, useState } from 'react'

export default function SharePage({ params }: { params: { id: string } }): JSX.Element {
  const [sharedData, setSharedData] = useState<DBSession[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSharedData(): Promise<void> {
      const { data, error } = await supabase
        .from('shared_sessions')
        .select('sessions_data')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        console.error('Error fetching shared data:', error)
        setError(error?.message || 'Shared link not found or expired')
        setLoading(false)
        return
      }

      setSharedData(data.sessions_data as DBSession[])
      setLoading(false)
    }

    fetchSharedData()
  }, [params.id])

  if (loading) return <Loading text="Loading shared data..." fullScreen />
  if (error || !sharedData) return <div className="container mx-auto py-8 text-center text-destructive">{error || 'Share link not found or expired'}</div>

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Shared Training Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Charts data={sharedData} />
          <Analytics externalData={sharedData} />
        </CardContent>
      </Card>
    </div>
  )
}