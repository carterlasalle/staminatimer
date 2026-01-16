/**
 * pSEO Types - Scalable Programmatic SEO Type Definitions
 *
 * This module provides TypeScript types for building scalable programmatic SEO pages.
 * All pSEO pages should use these types to ensure consistency and prevent regressions.
 */

import type { Metadata } from 'next'

// =============================================================================
// CORE SEO TYPES
// =============================================================================

/**
 * Site-wide configuration for SEO
 */
export interface SiteConfig {
  readonly name: string
  readonly url: string
  readonly description: string
  readonly ogImage: string
  readonly twitterHandle: string
  readonly locale: string
  readonly defaultKeywords: readonly string[]
}

/**
 * Represents a canonical internal link
 */
export interface InternalLink {
  readonly href: string
  readonly label: string
  readonly description?: string
  readonly priority?: number // 1-10, higher = more important
}

/**
 * Breadcrumb item for navigation and structured data
 */
export interface BreadcrumbItem {
  readonly name: string
  readonly url: string
}

// =============================================================================
// CONTENT TYPES
// =============================================================================

/**
 * Category for organizing pSEO content (hub-and-spoke model)
 */
export interface ContentCategory {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly slug: string
  readonly keywords: readonly string[]
  readonly priority: number // Sitemap priority (0.0 - 1.0)
}

/**
 * A content section within a page (for rich, non-thin content)
 */
export interface ContentSection {
  readonly title: string
  readonly content: string
  readonly minWords?: number // Minimum word count for this section
}

/**
 * FAQ item with required fields for schema markup
 */
export interface FAQItem {
  readonly question: string
  readonly answer: string
  readonly category?: string
  readonly relatedLinks?: readonly string[] // Related guide slugs
}

/**
 * A key takeaway or tip for content pages
 */
export interface ContentTip {
  readonly text: string
  readonly icon?: string
}

// =============================================================================
// GUIDE/ARTICLE TYPES (Primary pSEO Content)
// =============================================================================

/**
 * Minimum content requirements to prevent thin content
 */
export interface ContentRequirements {
  readonly minSections: number
  readonly minWordsPerSection: number
  readonly minTips: number
  readonly minTotalWords: number
}

/**
 * Full guide content including body text
 */
export interface GuideContent {
  readonly readTime: string
  readonly sections: readonly ContentSection[]
  readonly tips: readonly string[]
  readonly relatedGuides?: readonly string[] // Slugs of related guides
  readonly faqs?: readonly FAQItem[] // Page-specific FAQs
}

/**
 * Guide topic metadata (used for listings and routing)
 */
export interface GuideTopic {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly keywords: readonly string[]
  readonly category: string
  readonly priority: number // Sitemap priority (0.0 - 1.0)
  readonly publishedAt: string // ISO date string
  readonly updatedAt: string // ISO date string
  readonly author?: string
  readonly featured?: boolean
}

/**
 * Complete guide with metadata and content
 */
export interface Guide extends GuideTopic {
  readonly content: GuideContent
}

// =============================================================================
// SCHEMA.ORG TYPES
// =============================================================================

/**
 * Schema.org Article type for guide pages
 */
export interface ArticleSchema {
  readonly '@context': 'https://schema.org'
  readonly '@type': 'Article' | 'HowTo' | 'FAQPage'
  readonly headline: string
  readonly description: string
  readonly author: {
    readonly '@type': 'Organization'
    readonly name: string
    readonly url: string
  }
  readonly publisher: {
    readonly '@type': 'Organization'
    readonly name: string
    readonly url: string
    readonly logo: {
      readonly '@type': 'ImageObject'
      readonly url: string
    }
  }
  readonly mainEntityOfPage: string
  readonly datePublished: string
  readonly dateModified: string
  readonly image?: string
}

/**
 * Schema.org BreadcrumbList
 */
export interface BreadcrumbSchema {
  readonly '@context': 'https://schema.org'
  readonly '@type': 'BreadcrumbList'
  readonly itemListElement: readonly {
    readonly '@type': 'ListItem'
    readonly position: number
    readonly name: string
    readonly item: string
  }[]
}

// =============================================================================
// PAGE GENERATION TYPES
// =============================================================================

/**
 * Static params for dynamic routes
 */
export interface StaticParam {
  readonly slug: string
}

/**
 * Page props with async params (Next.js 15+)
 */
export interface PageProps<T = { slug: string }> {
  readonly params: Promise<T>
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>
}

/**
 * Metadata generation options
 */
export interface MetadataOptions {
  readonly title: string
  readonly description: string
  readonly path: string
  readonly keywords?: readonly string[]
  readonly ogImage?: string
  readonly ogType?: 'website' | 'article'
  readonly publishedTime?: string
  readonly modifiedTime?: string
  readonly authors?: readonly string[]
  readonly section?: string
  readonly noIndex?: boolean
}

// =============================================================================
// INTERNAL LINKING TYPES
// =============================================================================

/**
 * Hub page in hub-and-spoke model
 */
export interface HubPage {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly spokes: readonly string[] // Slugs of child pages
}

/**
 * Related content for internal linking
 */
export interface RelatedContent {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly category: string
  readonly relevanceScore: number // 0-1, how relevant to current page
}

/**
 * Internal link graph for preventing orphan pages
 */
export interface LinkGraph {
  readonly inboundLinks: readonly string[] // Pages linking TO this page
  readonly outboundLinks: readonly string[] // Pages this page links TO
  readonly siblings: readonly string[] // Pages in same category
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Content validation result
 */
export interface ValidationResult {
  readonly isValid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly wordCount: number
  readonly readabilityScore?: number
}

/**
 * Cannibalization check result
 */
export interface CannibalizationCheck {
  readonly hasCannibalization: boolean
  readonly conflictingPages: readonly {
    readonly slug: string
    readonly keyword: string
    readonly overlap: number // 0-1 percentage
  }[]
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Extract slug from guide topic
 */
export type GuideSlug = Guide['slug']

/**
 * Extract category from guide topic
 */
export type GuideCategory = Guide['category']

/**
 * Metadata with required canonical
 */
export type SEOMetadata = Metadata & {
  alternates: {
    canonical: string
  }
}
