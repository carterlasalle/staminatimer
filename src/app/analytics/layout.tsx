import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'View detailed analytics and insights about your stamina training progress.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
