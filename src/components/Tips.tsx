'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lightbulb } from 'lucide-react'
import { useMemo } from 'react'

const TIPS = [
  'Deep, slow breathing during edges helps maintain control.',
  'Track time between edges to find your optimal patterns.',
  'Aim for gradual weekly improvements, not dramatic changes.',
  'Consistency in practice leads to better long-term results.',
  'Use the Finish button honestly to keep analytics meaningful.',
]

export function Tips() {
  const tip = useMemo(() => {
    const idx = new Date().getDay() % TIPS.length
    return TIPS[idx]
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-amber-400" /> 
          Daily Tip
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-sm text-foreground">{tip}</p>
        </div>
      </CardContent>
    </Card>
  )
}

