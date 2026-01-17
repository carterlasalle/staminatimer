/**
 * Structured Data (JSON-LD) Generators
 *
 * Generates Schema.org structured data for rich search results.
 * Supports Article, FAQ, Breadcrumb, HowTo, and Organization schemas.
 */

import type { BreadcrumbItem, GuideTopic, FAQItem, GuideContent } from './types'
import { SITE_CONFIG } from './config'

// =============================================================================
// ORGANIZATION SCHEMA
// =============================================================================

/**
 * Generate Organization schema for the site
 */
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/icon.svg`,
    },
    description: SITE_CONFIG.description,
    sameAs: [
      // Add social profiles here when available
    ],
  }
}

/**
 * Generate WebSite schema for the homepage
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/guides?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// =============================================================================
// ARTICLE SCHEMA
// =============================================================================

/**
 * Generate Article schema for guide pages
 */
export function generateArticleSchema(guide: GuideTopic, content: GuideContent) {
  const url = `${SITE_CONFIG.url}/guides/${guide.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    articleSection: guide.category,
    keywords: guide.keywords.join(', '),
    wordCount: estimateWordCount(content),
    timeRequired: `PT${parseReadTime(content.readTime)}M`,
  }
}

/**
 * Generate HowTo schema for technique guides
 */
export function generateHowToSchema(
  guide: GuideTopic,
  content: GuideContent,
  steps: { name: string; text: string }[]
) {
  const url = `${SITE_CONFIG.url}/guides/${guide.slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.description,
    image: `${SITE_CONFIG.url}${SITE_CONFIG.ogImage}`,
    totalTime: `PT${parseReadTime(content.readTime)}M`,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${url}#step-${index + 1}`,
    })),
    mainEntityOfPage: url,
  }
}

// =============================================================================
// FAQ SCHEMA
// =============================================================================

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(faqs: readonly FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * Generate FAQ schema for inline FAQs on guide pages
 */
export function generateInlineFAQSchema(faqs: readonly FAQItem[], pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    isPartOf: {
      '@type': 'WebPage',
      '@id': pageUrl,
    },
  }
}

// =============================================================================
// BREADCRUMB SCHEMA
// =============================================================================

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: readonly BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  }
}

/**
 * Generate breadcrumb items for a guide page
 */
export function getGuideBreadcrumbs(guide: GuideTopic): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: guide.title, url: `/guides/${guide.slug}` },
  ]
}

/**
 * Generate breadcrumb items for the FAQ page
 */
export function getFAQBreadcrumbs(): BreadcrumbItem[] {
  return [
    { name: 'Home', url: '/' },
    { name: 'FAQ', url: '/faq' },
  ]
}

// =============================================================================
// COMBINED SCHEMA
// =============================================================================

/**
 * Generate all schemas for a guide page
 */
export function generateGuidePageSchemas(guide: GuideTopic, content: GuideContent): object[] {
  const schemas: object[] = [
    generateArticleSchema(guide, content),
    generateBreadcrumbSchema(getGuideBreadcrumbs(guide)),
  ]

  // Add FAQ schema if guide has FAQs
  if (content.faqs && content.faqs.length > 0) {
    schemas.push(
      generateInlineFAQSchema(content.faqs, `${SITE_CONFIG.url}/guides/${guide.slug}`)
    )
  }

  return schemas
}

/**
 * Render JSON-LD script tag content
 */
export function renderJsonLd(schema: object | object[]): string {
  const schemas = Array.isArray(schema) ? schema : [schema]
  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas)
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Parse read time string to minutes number
 */
function parseReadTime(readTime: string): number {
  const match = readTime.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 5
}

/**
 * Estimate word count from content
 */
function estimateWordCount(content: GuideContent): number {
  let count = 0
  content.sections.forEach((section) => {
    count += section.title.split(/\s+/).length
    count += section.content.split(/\s+/).length
  })
  content.tips.forEach((tip) => {
    count += tip.split(/\s+/).length
  })
  return count
}
