'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * Chart.js needs concrete colour strings, so the design tokens are resolved from
 * the document and re-resolved whenever the theme changes. Charts therefore follow
 * the palette instead of baking RGB values that go stale.
 */
export type ChartColors = {
  primary: string
  accent: string
  info: string
  warning: string
  destructive: string
  /** Axis tick and legend text. */
  tick: string
  /** Hairline grid lines. */
  grid: string
}

const FALLBACK: ChartColors = {
  primary: 'hsl(166 46% 47%)',
  accent: 'hsl(34 52% 60%)',
  info: 'hsl(205 45% 62%)',
  warning: 'hsl(34 58% 63%)',
  destructive: 'hsl(8 55% 60%)',
  tick: 'hsl(195 11% 65%)',
  grid: 'hsl(200 13% 20%)',
}

export function useChartColors(): ChartColors {
  const { theme } = useTheme()
  const [colors, setColors] = useState<ChartColors>(FALLBACK)

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const token = (name: string) => `hsl(${styles.getPropertyValue(name).trim()})`

    setColors({
      primary: token('--primary'),
      accent: token('--accent'),
      info: token('--info'),
      warning: token('--warning'),
      destructive: token('--destructive'),
      tick: token('--muted-foreground'),
      grid: token('--border'),
    })
  }, [theme])

  return colors
}
