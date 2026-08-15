'use client'

import { Analytics } from '@/components/Analytics'
import { Charts } from '@/components/Charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loading } from '@/components/ui/loading'
import { supabase } from '@/lib/supabase/client'
import type { DBSession } from '@/lib/types'
import { useEffect, useState, use } from 'react'

// In Next.js 15 with React 19, params is now a Promise
// Use React's use() hook to unwrap it in client components
export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [sharedData, setSharedData] = useState<DBSession[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    async function fetchSharedData(): Promise<void> {
      const { data, error } = await supabase.rpc('get_shared_session', {
        p_share_id: id,
      })

      if (error || !data) {
        if (error) console.error('Error fetching shared data:', error)
        setUnavailable(true)
        setLoading(false)
        return
      }

      setSharedData(data as unknown as DBSession[])
      setLoading(false)
    }

    fetchSharedData()
  }, [id])

  if (loading) return <Loading text="Loading shared data..." fullScreen />
  if (unavailable || !sharedData)
    return (
      <div className="container mx-auto py-8 text-center text-destructive" role="status">
        Shared link unavailable, not found, or expired.
      </div>
    )

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
