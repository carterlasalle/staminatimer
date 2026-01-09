import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your Stamina Timer account settings and preferences.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
