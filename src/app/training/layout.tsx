import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Training Session',
  description: 'Start your stamina training session with our precision timer and edge control tracking.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
