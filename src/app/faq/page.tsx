import { Metadata } from 'next'
import Link from 'next/link'
import { FAQ_DATA, SITE_CONFIG, generatePageMetadata } from '@/lib/seo/config'
import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd'
import { Timer, ArrowRight, HelpCircle } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata({
  title: 'FAQ - Frequently Asked Questions About Stamina Training',
  description: 'Get answers to common questions about stamina training, the Stamina Timer app, techniques, privacy, and how to see real results.',
  path: '/faq',
  keywords: ['stamina training faq', 'stamina questions', 'how to last longer faq', 'stamina timer help'],
})

export default function FAQPage() {
  // FAQ structured data
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_CONFIG.url },
          { name: 'FAQ', url: `${SITE_CONFIG.url}/faq` },
        ]}
      />
      <JsonLd data={faqJsonLd} />

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <Timer className="w-5 h-5" />
            <span className="font-semibold">Stamina Timer</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-20 border-b border-border">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about stamina training and the Stamina Timer app.
          </p>
        </div>
      </section>

      {/* FAQ List */}
      <main className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="space-y-8">
            {FAQ_DATA.map((faq, i) => (
              <div
                key={i}
                className="p-6 rounded-xl border border-border bg-card"
              >
                <h2 className="text-lg font-semibold mb-3">{faq.question}</h2>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          {/* More Questions CTA */}
          <div className="mt-16 p-8 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <h2 className="text-xl font-bold mb-2">Still Have Questions?</h2>
            <p className="text-muted-foreground mb-6">
              Check out our comprehensive training guides or start using the app - it&apos;s free!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/guides"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-card transition-colors"
              >
                Browse Guides
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Start Training Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-primary" />
              <span className="font-semibold">Stamina Timer</span>
            </Link>
            <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <Link href="/guides" className="hover:text-foreground transition-colors">Guides</Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </nav>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Stamina Timer
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
