'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Charts } from '@/components/Charts'
import { Analytics } from '@/components/Analytics'

export default function SharePage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSharedData() {
      const { data, error } = await supabase
        .from('shared_sessions')
        .select('sessions_data')
        .eq('id', params.id)
        .single()

      if (error) {
        console.error('Error fetching shared data:', error)
        return
      }

      setData(data.sessions_data)
      setLoading(false)
    }

    fetchSharedData()
  }, [params.id])

  if (loading) return <div>Loading shared data...</div>
  if (!data) return <div>Share link not found or expired</div>

  return (
    <div className="container max-w-7xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Shared Training Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Charts data={data} />
          <Analytics data={data} />
        </CardContent>
      </Card>
    </div>
  )
} 