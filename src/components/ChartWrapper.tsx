'use client'

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { ChartData, ChartOptions } from 'chart.js'

// Register Chart.js components once when this module is loaded
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type LineChartProps = {
  data: ChartData<'line'>
  options?: ChartOptions<'line'>
}

export function LineChart({ data, options }: LineChartProps) {
  return <Line data={data} options={options} />
}
