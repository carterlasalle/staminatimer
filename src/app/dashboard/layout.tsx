import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'View your stamina training progress, recent sessions, and achievements.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
