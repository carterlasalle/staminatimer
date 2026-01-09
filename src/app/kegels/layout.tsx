import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kegel Exercises',
  description: 'Practice kegel exercises to strengthen pelvic floor muscles and improve stamina control.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function KegelsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
