import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE_CONFIG, generatePageMetadata } from '@/lib/seo/config'
import { EXPANDED_GUIDE_TOPICS, GUIDE_CONTENT, getGuidesByCategory } from '@/lib/seo/guides-data'
import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd'
import { Timer, ArrowLeft, ArrowRight, Clock, CheckCircle, BookOpen } from 'lucide-react'

type PageProps = {
  params: Promise<{ slug: string }>
}

// Generate static params for all guides
export function generateStaticParams() {
  return EXPANDED_GUIDE_TOPICS.map((guide) => ({
    slug: guide.slug,
  }))
}

// Generate metadata for each guide
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = EXPANDED_GUIDE_TOPICS.find((g) => g.slug === slug)
  if (!guide) return {}

  return generatePageMetadata({
    title: `${guide.title} | Stamina Timer Guides`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords as unknown as string[],
  })
}

// Default content for guides without specific content
function getDefaultContent(guide: typeof EXPANDED_GUIDE_TOPICS[number]) {
  return {
    readTime: '6 min read',
    sections: [
      {
        title: `Understanding ${guide.title.replace(/:/g, '')}`,
        content: `${guide.description} This comprehensive guide will walk you through everything you need to know about this topic, from the basic concepts to advanced techniques. Whether you're just starting your stamina training journey or looking to refine your skills, this guide provides actionable insights backed by research and real-world experience.`,
      },
      {
        title: 'Why This Matters',
        content: `Mastering the concepts in this guide is essential for anyone serious about improving their stamina and control. The techniques and strategies outlined here have been proven effective through both scientific research and the experiences of thousands of men who have successfully improved their performance. By understanding and applying these principles, you'll be well on your way to achieving your goals.`,
      },
      {
        title: 'Getting Started',
        content: `Begin by reading through this entire guide to understand the key concepts. Then, start implementing the techniques gradually, one at a time. Remember that consistency is more important than intensity - regular practice, even in small amounts, will lead to better results than sporadic intensive sessions. Track your progress using the Stamina Timer app to stay motivated and see your improvement over time.`,
      },
      {
        title: 'Key Techniques',
        content: `The most effective approach combines multiple techniques rather than relying on a single method. Start with the fundamentals and gradually incorporate more advanced strategies as you become comfortable. Pay attention to how your body responds and adjust your practice accordingly. Everyone is different, so what works best for you may vary from general recommendations.`,
      },
    ],
    tips: [
      'Start with the basics and build a strong foundation before advancing',
      'Practice consistently - aim for regular short sessions rather than occasional long ones',
      'Track your progress to stay motivated and identify what works best for you',
      'Be patient - meaningful improvement takes time and dedication',
      'Combine multiple techniques for the best results',
    ],
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = EXPANDED_GUIDE_TOPICS.find((g) => g.slug === slug)
  const specificContent = GUIDE_CONTENT[slug]

  if (!guide) {
    notFound()
  }

  // Use specific content if available, otherwise use default
  const content = specificContent || getDefaultContent(guide)

  // Find related guides (same category, excluding current)
  const categoryGuides = getGuidesByCategory(guide.category)
  const relatedGuides = categoryGuides.filter((g) => g.slug !== guide.slug).slice(0, 3)

  // Find guides from other categories for cross-linking
  const otherCategoryGuides = EXPANDED_GUIDE_TOPICS
    .filter((g) => g.category !== guide.category && g.slug !== guide.slug && 'featured' in g && g.featured)
    .slice(0, 2)

  // Article structured data
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    author: {
      '@type': 'Organization',
      name: 'Stamina Timer',
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Stamina Timer',
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/icons/icon-512x512.png`,
      },
    },
    mainEntityOfPage: `${SITE_CONFIG.url}/guides/${guide.slug}`,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    keywords: guide.keywords.join(', '),
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: SITE_CONFIG.url },
          { name: 'Guides', url: `${SITE_CONFIG.url}/guides` },
          { name: guide.title, url: `${SITE_CONFIG.url}/guides/${guide.slug}` },
        ]}
      />
      <JsonLd data={articleJsonLd} />

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Timer className="w-5 h-5" />
              <span className="font-semibold">Stamina Timer</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="/guides" className="text-muted-foreground hover:text-foreground transition-colors">Guides</Link>
              <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/login" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Start Training
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href="/guides" className="hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              All Guides
            </Link>
            <span>/</span>
            <span className="capitalize">{guide.category}</span>
          </nav>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {guide.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {content.readTime}
            </span>
            <span className="capitalize px-2 py-0.5 bg-primary/10 text-primary rounded">
              {guide.category}
            </span>
            {'featured' in guide && guide.featured && (
              <span className="text-amber-600 font-medium">★ Featured</span>
            )}
          </div>

          {/* Intro */}
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            {guide.description}
          </p>

          {/* Table of Contents */}
          <div className="mb-12 p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              In This Guide
            </h2>
            <ul className="space-y-2">
              {content.sections.map((section, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {content.sections.map((section, i) => (
              <section key={i} id={`section-${i}`} className="scroll-mt-24">
                <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                <p className="text-foreground/90 leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>

          {/* Tips Box */}
          <div className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20">
            <h3 className="text-lg font-semibold mb-4">Key Takeaways</h3>
            <ul className="space-y-3">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground/90">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 rounded-xl bg-card border border-border text-center">
            <h3 className="text-xl font-bold mb-2">Put This Into Practice</h3>
            <p className="text-muted-foreground mb-6">
              Track your progress and get personalized insights with our free stamina training app.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Start Training Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Related Guides - Same Category */}
          {relatedGuides.length > 0 && (
            <div className="mt-16">
              <h3 className="text-xl font-bold mb-6">More {guide.category.charAt(0).toUpperCase() + guide.category.slice(1)} Guides</h3>
              <div className="grid gap-4">
                {relatedGuides.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/guides/${related.slug}`}
                    className="group block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {related.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {related.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Cross-category Links */}
          {otherCategoryGuides.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-6">You Might Also Like</h3>
              <div className="grid gap-4">
                {otherCategoryGuides.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/guides/${related.slug}`}
                    className="group block p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-primary font-medium capitalize">{related.category}</span>
                      {'featured' in related && related.featured && <span className="text-xs text-amber-600">★</span>}
                    </div>
                    <h4 className="font-semibold group-hover:text-primary transition-colors">
                      {related.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {related.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Browse All Link */}
          <div className="mt-12 text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Browse All {EXPANDED_GUIDE_TOPICS.length}+ Guides
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </article>

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
