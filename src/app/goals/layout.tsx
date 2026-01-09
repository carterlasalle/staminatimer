import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goals',
  description: 'Set and track your stamina training goals with personalized milestones.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
