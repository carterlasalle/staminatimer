import { Metadata } from 'next'
import Link from 'next/link'
import { generatePageMetadata, SITE_CONFIG } from '@/lib/seo/config'
import { EXPANDED_GUIDE_TOPICS, EXPANDED_CATEGORIES, getFeaturedGuides } from '@/lib/seo/guides-data'
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { Timer, BookOpen, ArrowRight, Brain, Dumbbell, Heart, Calendar, Beaker, Users, Wrench, Zap, AlertCircle, Salad } from 'lucide-react'

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
  lifestyle: <Salad className="w-5 h-5" />,
  relationships: <Users className="w-5 h-5" />,
  science: <Beaker className="w-5 h-5" />,
  problems: <AlertCircle className="w-5 h-5" />,
  tools: <Wrench className="w-5 h-5" />,
  advanced: <Zap className="w-5 h-5" />,
}

export default function GuidesPage() {
  // Group guides by category
  const guidesByCategory = EXPANDED_GUIDE_TOPICS.reduce((acc, guide) => {
    if (!acc[guide.category]) {
      acc[guide.category] = []
    }
    acc[guide.category].push(guide)
    return acc
  }, {} as Record<string, typeof EXPANDED_GUIDE_TOPICS[number][]>)

  const featuredGuides = getFeaturedGuides()

  // Order categories for display
  const categoryOrder = ['fundamentals', 'techniques', 'exercises', 'mental', 'routines', 'problems', 'lifestyle', 'relationships', 'science', 'tools', 'advanced']
  const orderedCategories = categoryOrder.filter(cat => guidesByCategory[cat])

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
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Timer className="w-5 h-5" />
              <span className="font-semibold">Stamina Timer</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/guides" className="text-foreground font-medium">Guides</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Start Training
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Stamina Training Guides
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            {EXPANDED_GUIDE_TOPICS.length}+ comprehensive guides on building lasting stamina and control.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Science-backed techniques and expert advice for real results.
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

      {/* Featured Guides */}
      {featuredGuides.length > 0 && (
        <section className="py-12 border-b border-border bg-card/50">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6">Featured Guides</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredGuides.slice(0, 6).map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group block p-6 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/50 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-primary px-2 py-0.5 bg-primary/10 rounded capitalize">
                      {guide.category}
                    </span>
                    <span className="text-xs text-amber-600 font-medium">★ Featured</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {guide.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Category Navigation */}
      <section className="py-6 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {orderedCategories.map((category) => {
              const cat = EXPANDED_CATEGORIES[category as keyof typeof EXPANDED_CATEGORIES]
              return (
                <a
                  key={category}
                  href={`#${category}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:border-primary/50 text-sm font-medium whitespace-nowrap transition-colors"
                >
                  {categoryIcons[category]}
                  {cat?.title || category}
                  <span className="text-xs text-muted-foreground">({guidesByCategory[category].length})</span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Guides by Category */}
      <main className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {orderedCategories.map((category) => {
            const guides = guidesByCategory[category]
            const cat = EXPANDED_CATEGORIES[category as keyof typeof EXPANDED_CATEGORIES]

            return (
              <section key={category} id={category} className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    {categoryIcons[category]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {cat?.title || category}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {cat?.description} • {guides.length} guides
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {guides.map((guide) => (
                    <Link
                      key={guide.slug}
                      href={`/guides/${guide.slug}`}
                      className="group block p-5 rounded-xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-base font-semibold group-hover:text-primary transition-colors line-clamp-1">
                          {guide.title}
                        </h3>
                        {'featured' in guide && guide.featured && (
                          <span className="text-xs text-amber-600 font-medium">★</span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {guide.description}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                        Read Guide
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </main>

      {/* Stats Section */}
      <section className="py-12 border-t border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">{EXPANDED_GUIDE_TOPICS.length}+</div>
              <div className="text-sm text-muted-foreground">Training Guides</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">{Object.keys(EXPANDED_CATEGORIES).length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Free Access</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">Science</div>
              <div className="text-sm text-muted-foreground">Backed Methods</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 border-t border-border">
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
        <div className="max-w-6xl mx-auto px-4">
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
