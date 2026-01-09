import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Coach',
  description: 'Get personalized stamina training advice from our AI-powered coach.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AICoachLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
