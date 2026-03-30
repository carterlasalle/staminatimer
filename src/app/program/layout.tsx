import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Guided Program',
  description: 'Phase-based guided training protocol with live coaching and progression tracking.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProgramLayout({ children }: { children: React.ReactNode }) {
  return children
}
