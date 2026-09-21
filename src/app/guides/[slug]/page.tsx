import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SITE_CONFIG, generatePageMetadata } from '@/lib/seo/config'
import { EXPANDED_GUIDE_TOPICS, findGuideContent, getGuidesByCategory } from '@/lib/seo/guides-data'
import { BreadcrumbJsonLd, JsonLd } from '@/components/seo/JsonLd'
import type { GuideContent } from '@/lib/seo/types'
import { validateAllGuides } from '@/lib/seo/validation'
import { Timer, ArrowLeft, ArrowRight, Clock, CheckCircle, BookOpen } from 'lucide-react'

type PageProps = {
  params: Promise<{ slug: string }>
}

type GuideWithContent = (typeof EXPANDED_GUIDE_TOPICS)[number] & { content: GuideContent }

// Generate static params for all guides
export function generateStaticParams() {
  const withContent = EXPANDED_GUIDE_TOPICS.map((topic) => ({
    ...topic,
    content: findGuideContent(topic.slug),
  }))

  // Every published topic needs its own content. This used to be optional and
  // fell back to one shared block of boilerplate, which meant 55 pages served
  // near-identical prose that also claimed "thousands of men" had results.
  // Failing the build is the point: a missing guide is a data bug.
  const incomplete = withContent.flatMap((guide) => (guide.content ? [] : [guide.slug]))

  if (incomplete.length > 0) {
    throw new Error(
      `[guides] ${incomplete.length} topic(s) have no content in GUIDE_CONTENT: ${incomplete.join(', ')}`
    )
  }

  const guideList = withContent.filter((guide): guide is GuideWithContent => !!guide.content)

  // The repository's own thin-content bar, finally enforced. It was written but
  // never called, so nothing stopped a 200-word page from being published.
  const { isValid, results } = validateAllGuides(guideList)

  if (!isValid) {
    const failures = [...results].flatMap(([slug, result]) =>
      result.isValid ? [] : [`  ${slug}: ${result.errors.join('; ')}`]
    )

    throw new Error(`[guides] content validation failed:\n${failures.join('\n')}`)
  }

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
    keywords: [...guide.keywords],
  })
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = EXPANDED_GUIDE_TOPICS.find((g) => g.slug === slug)
  const content = findGuideContent(slug)

  if (!guide) {
    notFound()
  }

  // Every published topic has its own content; `generateStaticParams` fails the
  // build otherwise. A guide without it is a data bug, not something to paper
  // over with filler.
  if (!content) {
    notFound()
  }

  // Find related guides (same category, excluding current)
  const categoryGuides = getGuidesByCategory(guide.category)
  const relatedGuides = categoryGuides.filter((g) => g.slug !== guide.slug).slice(0, 3)

  // Find guides from other categories for cross-linking
  const otherCategoryGuides = EXPANDED_GUIDE_TOPICS.filter(
    (g) => g.category !== guide.category && g.slug !== guide.slug && 'featured' in g && g.featured
  ).slice(0, 2)

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

  // FAQPage markup, but only when the questions are genuinely on the page —
  // Google requires the Q&A to be visible, and a mismatch is worse than none.
  const faqJsonLd =
    content.faqs && content.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: content.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null

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
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              <Timer className="w-5 h-5" />
              <span className="font-semibold">Stamina Timer</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/guides"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Guides
              </Link>
              <Link
                href="/faq"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{guide.title}</h1>

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
              <span className="text-accent font-medium">★ Featured</span>
            )}
          </div>

          {/* Intro */}
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">{guide.description}</p>

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

          {/* Questions the page answers, in the words people search with */}
          {content.faqs && content.faqs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Common questions</h2>
              <dl className="border-y border-border/60 divide-y divide-border/60">
                {content.faqs.map((faq, i) => (
                  <div key={i} className="py-5">
                    <dt className="font-medium text-foreground">{faq.question}</dt>
                    <dd className="mt-2 leading-relaxed text-foreground/90">{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

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
              <h3 className="text-xl font-bold mb-6">
                More {guide.category.charAt(0).toUpperCase() + guide.category.slice(1)} Guides
              </h3>
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
                      <span className="text-xs text-primary font-medium capitalize">
                        {related.category}
                      </span>
                      {'featured' in related && related.featured && (
                        <span className="text-xs text-accent">★</span>
                      )}
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
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/guides" className="hover:text-foreground transition-colors">
                Guides
              </Link>
              <Link href="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
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
