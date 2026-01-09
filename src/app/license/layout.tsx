import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'License',
  description: 'Software license information for Stamina Timer application.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function LicenseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
