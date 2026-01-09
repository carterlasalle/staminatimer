import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Stamina Timer protects your privacy. Your data is encrypted, never shared, and you maintain full control. Complete privacy for your personal training.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Privacy Policy - Stamina Timer',
    description: 'Your privacy is our priority. Learn how we protect your personal training data.',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
