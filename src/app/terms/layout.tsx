import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions for using Stamina Timer. Understand your rights and responsibilities when using our stamina training platform.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Service - Stamina Timer',
    description: 'Terms and conditions for using the Stamina Timer training platform.',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
