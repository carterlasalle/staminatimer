/**
 * Metadata Generation Utilities
 *
 * Provides type-safe metadata generation for all pSEO pages.
 * Uses Next.js 15 Metadata API with full OpenGraph and Twitter Card support.
 */

import type { Metadata } from 'next'
import type { MetadataOptions, GuideTopic, SEOMetadata } from './types'
import { SITE_CONFIG } from './config'

// =============================================================================
// CORE METADATA GENERATOR
// =============================================================================

/**
 * Generate complete metadata for any page
 * Use this for all pages to ensure consistent SEO implementation
 */
export function generateMetadata(options: MetadataOptions): SEOMetadata {
  const {
    title,
    description,
    path,
    keywords = [],
    ogImage,
    ogType = 'website',
    publishedTime,
    modifiedTime,
    authors,
    section,
    noIndex = false,
  } = options

  const url = `${SITE_CONFIG.url}${path}`
  const image = ogImage || SITE_CONFIG.ogImage
  const fullImageUrl = image.startsWith('http') ? image : `${SITE_CONFIG.url}${image}`

  // Combine page keywords with site defaults
  const allKeywords = [
    ...new Set([...keywords, 'stamina timer', 'stamina training', 'last longer']),
  ]

  const metadata: SEOMetadata = {
    title,
    description,
    keywords: allKeywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      type: ogType,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors && { authors }),
      ...(section && { section }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [fullImageUrl],
      creator: SITE_CONFIG.twitterHandle,
    },
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  }

  return metadata
}

// =============================================================================
// PAGE-SPECIFIC METADATA GENERATORS
// =============================================================================

/**
 * Generate metadata for guide pages (article type)
 */
export function generateGuideMetadata(guide: GuideTopic): SEOMetadata {
  return generateMetadata({
    title: `${guide.title} | ${SITE_CONFIG.name}`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    keywords: guide.keywords,
    ogType: 'article',
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
    section: guide.category,
  })
}

/**
 * Generate metadata for the guides hub page
 */
export function generateGuidesHubMetadata(): SEOMetadata {
  return generateMetadata({
    title: `Stamina Training Guides | ${SITE_CONFIG.name}`,
    description:
      'Comprehensive guides on stamina training techniques, exercises, and strategies. Learn from science-backed methods to build lasting control.',
    path: '/guides',
    keywords: [
      'stamina guides',
      'stamina training guides',
      'how to last longer guides',
      'stamina techniques',
    ],
  })
}

/**
 * Generate metadata for the FAQ page
 */
export function generateFAQMetadata(): SEOMetadata {
  return generateMetadata({
    title: `Frequently Asked Questions | ${SITE_CONFIG.name}`,
    description:
      'Get answers to common questions about stamina training, techniques, and the Stamina Timer app. Learn how to improve your performance.',
    path: '/faq',
    keywords: [
      'stamina training FAQ',
      'stamina questions',
      'how to improve stamina',
      'stamina timer help',
    ],
  })
}

/**
 * Generate metadata for category pages
 */
export function generateCategoryMetadata(
  categoryId: string,
  categoryTitle: string,
  categoryDescription: string
): SEOMetadata {
  return generateMetadata({
    title: `${categoryTitle} Guides | ${SITE_CONFIG.name}`,
    description: categoryDescription,
    path: `/guides/category/${categoryId}`,
    keywords: [
      `${categoryTitle.toLowerCase()} guides`,
      `${categoryTitle.toLowerCase()} training`,
      'stamina techniques',
    ],
  })
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Truncate text for meta descriptions (max 160 chars)
 */
export function truncateDescription(text: string, maxLength = 155): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + '...'
}

/**
 * Generate page title with site name
 */
export function formatPageTitle(pageTitle: string): string {
  return `${pageTitle} | ${SITE_CONFIG.name}`
}

/**
 * Validate metadata meets SEO best practices
 */
export function validateMetadata(metadata: Metadata): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  const title = typeof metadata.title === 'string' ? metadata.title : ''
  const description = metadata.description || ''

  // Title length check (30-60 chars optimal)
  if (title.length < 30) {
    warnings.push(`Title is short (${title.length} chars), aim for 30-60 characters`)
  } else if (title.length > 60) {
    warnings.push(`Title may be truncated in SERPs (${title.length} chars)`)
  }

  // Description length check (120-160 chars optimal)
  if (description.length < 120) {
    warnings.push(`Description is short (${description.length} chars), aim for 120-160 characters`)
  } else if (description.length > 160) {
    warnings.push(`Description may be truncated in SERPs (${description.length} chars)`)
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}
