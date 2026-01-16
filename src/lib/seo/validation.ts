/**
 * pSEO Content Validation Utilities
 *
 * Prevents thin content, keyword cannibalization, and ensures quality
 * at scale for programmatic SEO pages.
 */

import type {
  ContentRequirements,
  ValidationResult,
  CannibalizationCheck,
  GuideContent,
  GuideTopic,
  ContentSection,
} from './types'

// =============================================================================
// CONTENT REQUIREMENTS
// =============================================================================

/**
 * Minimum content requirements for different page types
 * These thresholds prevent thin content from being published
 */
export const CONTENT_REQUIREMENTS: Record<string, ContentRequirements> = {
  guide: {
    minSections: 3,
    minWordsPerSection: 80,
    minTips: 3,
    minTotalWords: 500,
  },
  category: {
    minSections: 1,
    minWordsPerSection: 50,
    minTips: 0,
    minTotalWords: 150,
  },
  faq: {
    minSections: 5, // 5 Q&As minimum
    minWordsPerSection: 30,
    minTips: 0,
    minTotalWords: 300,
  },
} as const

// =============================================================================
// WORD COUNT UTILITIES
// =============================================================================

/**
 * Count words in a string, handling edge cases
 */
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length
}

/**
 * Count total words in content sections
 */
export function countSectionWords(sections: readonly ContentSection[]): number {
  return sections.reduce((total, section) => {
    return total + countWords(section.title) + countWords(section.content)
  }, 0)
}

/**
 * Count total words in guide content
 */
export function countGuideWords(content: GuideContent): number {
  const sectionWords = countSectionWords(content.sections)
  const tipWords = content.tips.reduce((total, tip) => total + countWords(tip), 0)
  return sectionWords + tipWords
}

// =============================================================================
// CONTENT VALIDATION
// =============================================================================

/**
 * Validate guide content meets minimum requirements
 */
export function validateGuideContent(
  content: GuideContent,
  requirements: ContentRequirements = CONTENT_REQUIREMENTS.guide
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check section count
  if (content.sections.length < requirements.minSections) {
    errors.push(
      `Guide must have at least ${requirements.minSections} sections, found ${content.sections.length}`
    )
  }

  // Check each section's word count
  content.sections.forEach((section, index) => {
    const sectionWords = countWords(section.content)
    if (sectionWords < requirements.minWordsPerSection) {
      errors.push(
        `Section ${index + 1} ("${section.title}") has ${sectionWords} words, minimum is ${requirements.minWordsPerSection}`
      )
    }
    if (sectionWords < requirements.minWordsPerSection * 1.5) {
      warnings.push(
        `Section ${index + 1} ("${section.title}") is thin at ${sectionWords} words, consider expanding`
      )
    }
  })

  // Check tips count
  if (content.tips.length < requirements.minTips) {
    errors.push(
      `Guide must have at least ${requirements.minTips} tips, found ${content.tips.length}`
    )
  }

  // Check total word count
  const totalWords = countGuideWords(content)
  if (totalWords < requirements.minTotalWords) {
    errors.push(
      `Guide has ${totalWords} total words, minimum is ${requirements.minTotalWords}`
    )
  }

  // Warn if content is borderline thin
  if (totalWords < requirements.minTotalWords * 1.5 && totalWords >= requirements.minTotalWords) {
    warnings.push(
      `Guide has only ${totalWords} words, consider adding more content for better SEO`
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    wordCount: totalWords,
  }
}

/**
 * Validate guide metadata
 */
export function validateGuideTopic(topic: GuideTopic): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Title length (30-60 chars optimal for SERP)
  if (topic.title.length < 20) {
    errors.push(`Title "${topic.title}" is too short (${topic.title.length} chars), minimum 20`)
  }
  if (topic.title.length > 60) {
    warnings.push(`Title "${topic.title}" may be truncated in SERPs (${topic.title.length} chars)`)
  }

  // Description length (120-160 chars optimal)
  if (topic.description.length < 80) {
    errors.push(`Description is too short (${topic.description.length} chars), minimum 80`)
  }
  if (topic.description.length > 160) {
    warnings.push(`Description may be truncated in SERPs (${topic.description.length} chars)`)
  }

  // Keywords
  if (topic.keywords.length < 2) {
    errors.push(`Guide should have at least 2 keywords, found ${topic.keywords.length}`)
  }
  if (topic.keywords.length > 10) {
    warnings.push(`Too many keywords (${topic.keywords.length}), focus on 3-5 primary keywords`)
  }

  // Slug format
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.slug)) {
    errors.push(`Slug "${topic.slug}" contains invalid characters, use lowercase with hyphens`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    wordCount: countWords(topic.title) + countWords(topic.description),
  }
}

// =============================================================================
// KEYWORD CANNIBALIZATION DETECTION
// =============================================================================

/**
 * Calculate keyword overlap between two guides
 * Returns a score from 0-1 where 1 means identical keywords
 */
export function calculateKeywordOverlap(
  keywords1: readonly string[],
  keywords2: readonly string[]
): number {
  const set1 = new Set(keywords1.map((k) => k.toLowerCase()))
  const set2 = new Set(keywords2.map((k) => k.toLowerCase()))

  let overlap = 0
  set1.forEach((k) => {
    if (set2.has(k)) overlap++
    // Also check for partial matches (one keyword contains another)
    set2.forEach((k2) => {
      if (k !== k2 && (k.includes(k2) || k2.includes(k))) {
        overlap += 0.5
      }
    })
  })

  const maxPossible = Math.max(set1.size, set2.size)
  return maxPossible > 0 ? Math.min(overlap / maxPossible, 1) : 0
}

/**
 * Check for keyword cannibalization across all guides
 * Returns guides that might be competing for the same keywords
 */
export function checkCannibalization(
  guides: readonly GuideTopic[],
  currentSlug: string,
  threshold = 0.4 // 40% overlap triggers warning
): CannibalizationCheck {
  const currentGuide = guides.find((g) => g.slug === currentSlug)
  if (!currentGuide) {
    return { hasCannibalization: false, conflictingPages: [] }
  }

  const conflicts: { slug: string; keyword: string; overlap: number }[] = []

  guides.forEach((guide) => {
    if (guide.slug === currentSlug) return

    const overlap = calculateKeywordOverlap(currentGuide.keywords, guide.keywords)
    if (overlap >= threshold) {
      // Find the specific conflicting keywords
      const conflictingKeywords = currentGuide.keywords.filter((k1) =>
        guide.keywords.some(
          (k2) =>
            k1.toLowerCase() === k2.toLowerCase() ||
            k1.toLowerCase().includes(k2.toLowerCase()) ||
            k2.toLowerCase().includes(k1.toLowerCase())
        )
      )

      conflicts.push({
        slug: guide.slug,
        keyword: conflictingKeywords[0] || 'multiple keywords',
        overlap,
      })
    }
  })

  const sortedConflicts = conflicts.sort((a, b) => b.overlap - a.overlap)

  return {
    hasCannibalization: sortedConflicts.length > 0,
    conflictingPages: sortedConflicts,
  }
}

// =============================================================================
// BULK VALIDATION
// =============================================================================

/**
 * Validate all guides at build time
 * Use this in a build script to catch issues before deployment
 */
export function validateAllGuides(
  guides: readonly (GuideTopic & { content: GuideContent })[]
): {
  isValid: boolean
  results: Map<string, ValidationResult>
  cannibalization: CannibalizationCheck[]
} {
  const results = new Map<string, ValidationResult>()
  const cannibalizationResults: CannibalizationCheck[] = []

  // Validate each guide
  guides.forEach((guide) => {
    const topicValidation = validateGuideTopic(guide)
    const contentValidation = validateGuideContent(guide.content)

    results.set(guide.slug, {
      isValid: topicValidation.isValid && contentValidation.isValid,
      errors: [...topicValidation.errors, ...contentValidation.errors],
      warnings: [...topicValidation.warnings, ...contentValidation.warnings],
      wordCount: contentValidation.wordCount,
    })

    // Check for cannibalization
    const cannibalization = checkCannibalization(guides, guide.slug)
    if (cannibalization.hasCannibalization) {
      cannibalizationResults.push(cannibalization)
    }
  })

  const isValid = Array.from(results.values()).every((r) => r.isValid)

  return {
    isValid,
    results,
    cannibalization: cannibalizationResults,
  }
}

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Log validation results in development
 */
export function logValidationResults(
  slug: string,
  result: ValidationResult,
  verbose = false
): void {
  if (process.env.NODE_ENV !== 'development') return

  if (!result.isValid) {
    console.error(`❌ [SEO] ${slug}: Validation failed`)
    result.errors.forEach((e) => console.error(`   - ${e}`))
  } else if (verbose || result.warnings.length > 0) {
    console.warn(`⚠️ [SEO] ${slug}: ${result.wordCount} words`)
    result.warnings.forEach((w) => console.warn(`   - ${w}`))
  }
}
