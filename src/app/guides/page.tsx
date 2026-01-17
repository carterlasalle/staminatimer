import { Metadata } from 'next'
import Link from 'next/link'
import { GUIDE_TOPICS, GUIDE_CATEGORIES, generatePageMetadata, SITE_CONFIG } from '@/lib/seo/config'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { Timer, BookOpen, ArrowRight, Brain, Dumbbell, Heart, Calendar } from 'lucide-react'

export const metadata: Metadata = generatePageMetadata({
  title: 'Stamina Training Guides - Expert Tips & Techniques',
  description: 'Comprehensive guides on stamina training, edging techniques, kegel exercises, and proven methods to build lasting control. Science-backed advice for real results.',
  path: '/guides',
  keywords: ['stamina guides', 'stamina training tips', 'how to last longer', 'stamina techniques', 'edging guide'],
})

const categoryIcons: Record<string, React.ReactNode> = {
  fundamentals: <BookOpen className="w-5 h-5" />,
  techniques: <Brain className="w-5 h-5" />,
  exercises: <Dumbbell className="w-5 h-5" />,
  mental: <Heart className="w-5 h-5" />,
  routines: <Calendar className="w-5 h-5" />,
}

export default function GuidesPage() {
  // Group guides by category
  const guidesByCategory = GUIDE_TOPICS.reduce((acc, guide) => {
    if (!acc[guide.category]) {
      acc[guide.category] = []
    }
    acc[guide.category].push(guide)
    return acc
  }, {} as Record<string, typeof GUIDE_TOPICS[number][]>)

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_CONFIG.url },
          { name: 'Training Guides', url: `${SITE_CONFIG.url}/guides` },
        ]}
      />

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-6">
            <Timer className="w-5 h-5" />
            <span className="font-semibold">Stamina Timer</span>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Stamina Training Guides
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Science-backed techniques and expert advice to help you build lasting stamina and control.
            Start your journey to better performance today.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Start Training Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Guides by Category */}
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          {Object.entries(guidesByCategory).map(([category, guides]) => (
            <section key={category} className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  {categoryIcons[category]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {GUIDE_CATEGORIES[category as keyof typeof GUIDE_CATEGORIES]?.title || category}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {GUIDE_CATEGORIES[category as keyof typeof GUIDE_CATEGORIES]?.description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {guides.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guides/${guide.slug}`}
                    className="group block p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                  >
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {guide.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {guide.description}
                    </p>
                    <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                      Read Guide
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* CTA Section */}
      <section className="py-16 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Put This Into Practice?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Start tracking your progress with our free stamina training app.
            Get personalized insights and see real improvement in weeks.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer with internal links */}
      <footer className="border-t border-border py-12">
        <div className="max-w-4xl mx-auto px-4">
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
