import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In - Start Your Stamina Training',
  description: 'Sign in or create a free account to start your stamina training journey. Track progress, build control, and see real improvement in weeks.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sign In to Stamina Timer',
    description: 'Start your stamina training journey. Free to use, completely private.',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
