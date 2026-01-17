import Link from 'next/link'
import { Timer } from 'lucide-react'

// Internal links for SEO - ensures consistent linking across site
const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/guides', label: 'Guides' },
  { href: '/faq', label: 'FAQ' },
  { href: '/login', label: 'Get Started' },
]

const LEGAL_LINKS = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
  { href: '/license', label: 'License' },
]

type FooterProps = {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
}

export function SEOFooter({ maxWidth = '4xl' }: FooterProps) {
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4`}>
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <Timer className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Stamina Timer</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm">
              Science-backed stamina training app for men. Build lasting control
              with data-driven progress tracking.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <nav className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <nav className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Stamina Timer. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Built for your privacy. No ads. No data selling.
          </p>
        </div>
      </div>
    </footer>
  )
}

// Simpler inline footer for pages that need it
export function SimpleFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <span className="font-semibold">Stamina Timer</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[...NAV_LINKS.slice(0, 3), ...LEGAL_LINKS.slice(0, 2)].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Stamina Timer
          </p>
        </div>
      </div>
    </footer>
  )
}
