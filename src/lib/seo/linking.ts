/**
 * Internal Linking Utilities
 *
 * Implements hub-and-spoke model for internal linking.
 * Prevents orphan pages and ensures healthy link graph.
 */

import type { GuideTopic, InternalLink, RelatedContent, LinkGraph, HubPage } from './types'
import { GUIDE_TOPICS, GUIDE_CATEGORIES } from './config'

// =============================================================================
// HUB-AND-SPOKE MODEL
// =============================================================================

/**
 * Hub pages that link to spoke (child) pages
 * Each hub should link to all its spokes, and each spoke should link back to hub
 */
export const HUB_PAGES: HubPage[] = [
  {
    slug: 'guides',
    title: 'Training Guides',
    description: 'Comprehensive stamina training guides',
    spokes: GUIDE_TOPICS.map((g) => g.slug),
  },
]

/**
 * Get the hub page for a given spoke
 */
export function getHubForSpoke(spokeSlug: string): HubPage | null {
  return HUB_PAGES.find((hub) => hub.spokes.includes(spokeSlug)) || null
}

/**
 * Get all spokes for a hub page
 */
export function getSpokesForHub(hubSlug: string): string[] {
  const hub = HUB_PAGES.find((h) => h.slug === hubSlug)
  return hub?.spokes ? [...hub.spokes] : []
}

// =============================================================================
// RELATED CONTENT
// =============================================================================

/**
 * Get related guides based on category and keyword overlap
 */
export function getRelatedGuides(
  currentSlug: string,
  limit = 3
): RelatedContent[] {
  const currentGuide = GUIDE_TOPICS.find((g) => g.slug === currentSlug)
  if (!currentGuide) return []

  const scored = GUIDE_TOPICS.filter((g) => g.slug !== currentSlug).map((guide) => {
    let score = 0

    // Same category gets highest score
    if (guide.category === currentGuide.category) {
      score += 0.5
    }

    // Keyword overlap
    const currentKeywords = new Set(currentGuide.keywords.map((k) => k.toLowerCase()))
    const matchingKeywords = guide.keywords.filter((k) =>
      currentKeywords.has(k.toLowerCase())
    )
    score += matchingKeywords.length * 0.2

    // Partial keyword matches
    guide.keywords.forEach((keyword) => {
      currentGuide.keywords.forEach((currentKeyword) => {
        if (
          keyword.toLowerCase().includes(currentKeyword.toLowerCase()) ||
          currentKeyword.toLowerCase().includes(keyword.toLowerCase())
        ) {
          score += 0.1
        }
      })
    })

    return {
      slug: guide.slug,
      title: guide.title,
      description: guide.description,
      category: guide.category,
      relevanceScore: Math.min(score, 1), // Cap at 1
    }
  })

  // Sort by relevance and return top results
  return scored
    .filter((g) => g.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

/**
 * Get guides in the same category
 */
export function getSiblingGuides(currentSlug: string, limit = 4): GuideTopic[] {
  const currentGuide = GUIDE_TOPICS.find((g) => g.slug === currentSlug)
  if (!currentGuide) return []

  return GUIDE_TOPICS.filter(
    (g) => g.category === currentGuide.category && g.slug !== currentSlug
  ).slice(0, limit)
}

/**
 * Get guides from different categories for diversity
 */
export function getCrossCategory(currentSlug: string, limit = 2): GuideTopic[] {
  const currentGuide = GUIDE_TOPICS.find((g) => g.slug === currentSlug)
  if (!currentGuide) return []

  // Get one guide from each different category
  const categories = Object.keys(GUIDE_CATEGORIES).filter(
    (c) => c !== currentGuide.category
  )

  const guides: GuideTopic[] = []
  for (const category of categories) {
    if (guides.length >= limit) break
    const guide = GUIDE_TOPICS.find(
      (g) => g.category === category && g.slug !== currentSlug
    )
    if (guide) guides.push(guide)
  }

  return guides
}

// =============================================================================
// LINK GRAPH ANALYSIS
// =============================================================================

/**
 * Build the link graph for a page
 * Useful for ensuring no orphan pages exist
 */
export function buildLinkGraph(slug: string): LinkGraph {
  const inboundLinks: string[] = []
  const outboundLinks: string[] = []
  const siblings: string[] = []

  const currentGuide = GUIDE_TOPICS.find((g) => g.slug === slug)

  // Hub pages link to all guides
  const hub = getHubForSpoke(slug)
  if (hub) {
    inboundLinks.push(hub.slug)
  }

  if (currentGuide) {
    // Related guides create bidirectional links
    const related = getRelatedGuides(slug, 5)
    related.forEach((r) => {
      outboundLinks.push(r.slug)
      // Assume the related guide also links back (bidirectional)
      inboundLinks.push(r.slug)
    })

    // Siblings in same category
    const siblingGuides = getSiblingGuides(slug, 10)
    siblingGuides.forEach((s) => {
      siblings.push(s.slug)
    })
  }

  return {
    inboundLinks: [...new Set(inboundLinks)],
    outboundLinks: [...new Set(outboundLinks)],
    siblings: [...new Set(siblings)],
  }
}

/**
 * Check for orphan pages (pages with no inbound links)
 * Run this during build to catch issues
 */
export function findOrphanPages(): string[] {
  const orphans: string[] = []

  GUIDE_TOPICS.forEach((guide) => {
    const graph = buildLinkGraph(guide.slug)
    if (graph.inboundLinks.length === 0) {
      orphans.push(guide.slug)
    }
  })

  return orphans
}

// =============================================================================
// NAVIGATION LINKS
// =============================================================================

/**
 * Primary navigation links
 */
export const NAV_LINKS: InternalLink[] = [
  { href: '/', label: 'Home', priority: 10 },
  { href: '/guides', label: 'Guides', priority: 9 },
  { href: '/faq', label: 'FAQ', priority: 8 },
  { href: '/login', label: 'Get Started', priority: 10 },
]

/**
 * Footer navigation links
 */
export const FOOTER_LINKS: InternalLink[] = [
  { href: '/', label: 'Home', priority: 10 },
  { href: '/guides', label: 'Guides', priority: 9 },
  { href: '/faq', label: 'FAQ', priority: 8 },
  { href: '/privacy', label: 'Privacy', priority: 5 },
  { href: '/terms', label: 'Terms', priority: 5 },
  { href: '/license', label: 'License', priority: 4 },
]

/**
 * Get contextual links for a page
 * Returns navigation + related + hub links
 */
export function getContextualLinks(currentPath: string): {
  navigation: InternalLink[]
  related: RelatedContent[]
  breadcrumbs: { name: string; url: string }[]
} {
  const navigation = NAV_LINKS.filter((link) => link.href !== currentPath)

  // Extract slug from path
  const match = currentPath.match(/\/guides\/([^/]+)/)
  const slug = match ? match[1] : null

  const related = slug ? getRelatedGuides(slug) : []

  // Build breadcrumbs
  const breadcrumbs: { name: string; url: string }[] = [{ name: 'Home', url: '/' }]

  if (currentPath.startsWith('/guides')) {
    breadcrumbs.push({ name: 'Guides', url: '/guides' })
    if (slug) {
      const guide = GUIDE_TOPICS.find((g) => g.slug === slug)
      if (guide) {
        breadcrumbs.push({ name: guide.title, url: currentPath })
      }
    }
  } else if (currentPath === '/faq') {
    breadcrumbs.push({ name: 'FAQ', url: '/faq' })
  }

  return { navigation, related, breadcrumbs }
}

// =============================================================================
// CATEGORY NAVIGATION
// =============================================================================

/**
 * Get guides grouped by category
 */
export function getGuidesByCategory(): Record<string, GuideTopic[]> {
  const grouped: Record<string, GuideTopic[]> = {}

  GUIDE_TOPICS.forEach((guide) => {
    if (!grouped[guide.category]) {
      grouped[guide.category] = []
    }
    grouped[guide.category].push(guide)
  })

  return grouped
}

/**
 * Get category info with guide count
 */
export function getCategoriesWithCounts(): {
  id: string
  title: string
  description: string
  count: number
}[] {
  const grouped = getGuidesByCategory()

  return Object.entries(GUIDE_CATEGORIES).map(([id, category]) => ({
    id,
    title: category.title,
    description: category.description,
    count: grouped[id]?.length || 0,
  }))
}
