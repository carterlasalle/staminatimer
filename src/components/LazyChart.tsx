'use client'

import dynamic from 'next/dynamic'
import { Loading } from '@/components/ui/loading'
import type { ChartProps } from 'react-chartjs-2'

// Dynamically import the chart component with no SSR
// This reduces initial bundle size by ~200KB
const LineChart = dynamic(
  () => import('./ChartWrapper').then((mod) => mod.LineChart),
  {
    ssr: false,
    loading: () => <Loading text="Loading chart..." className="h-[300px]" />,
  }
)

// Re-export the lazy-loaded component
export { LineChart }

// Type export for consumers
export type { ChartProps }
