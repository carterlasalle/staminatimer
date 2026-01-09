import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mental Training',
  description: 'Build mental control and overcome performance anxiety with guided exercises.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function MentalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
