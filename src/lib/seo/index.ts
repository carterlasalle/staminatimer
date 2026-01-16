/**
 * SEO Module - Barrel Export
 *
 * Central export for all pSEO utilities and types.
 * Import from '@/lib/seo' for cleaner imports.
 */

// Types
export type {
  SiteConfig,
  InternalLink,
  BreadcrumbItem,
  ContentCategory,
  ContentSection,
  FAQItem,
  ContentTip,
  ContentRequirements,
  GuideContent,
  GuideTopic,
  Guide,
  ArticleSchema,
  BreadcrumbSchema,
  StaticParam,
  PageProps,
  MetadataOptions,
  HubPage,
  RelatedContent,
  LinkGraph,
  ValidationResult,
  CannibalizationCheck,
  GuideSlug,
  GuideCategory,
  SEOMetadata,
} from './types'

// Configuration
export {
  SITE_CONFIG,
  GUIDE_TOPICS,
  FAQ_DATA,
  GUIDE_CATEGORIES,
  INTERNAL_LINKS,
  generatePageMetadata,
} from './config'

// Metadata utilities
export {
  generateMetadata,
  generateGuideMetadata,
  generateGuidesHubMetadata,
  generateFAQMetadata,
  generateCategoryMetadata,
  truncateDescription,
  formatPageTitle,
  validateMetadata,
} from './metadata'

// Schema (JSON-LD) generators
export {
  generateOrganizationSchema,
  generateWebSiteSchema,
  generateArticleSchema,
  generateHowToSchema,
  generateFAQSchema,
  generateInlineFAQSchema,
  generateBreadcrumbSchema,
  getGuideBreadcrumbs,
  getFAQBreadcrumbs,
  generateGuidePageSchemas,
  renderJsonLd,
} from './schema'

// Internal linking utilities
export {
  HUB_PAGES,
  getHubForSpoke,
  getSpokesForHub,
  getRelatedGuides,
  getSiblingGuides,
  getCrossCategory,
  buildLinkGraph,
  findOrphanPages,
  NAV_LINKS,
  FOOTER_LINKS,
  getContextualLinks,
  getGuidesByCategory,
  getCategoriesWithCounts,
} from './linking'

// Validation utilities
export {
  CONTENT_REQUIREMENTS,
  countWords,
  countSectionWords,
  countGuideWords,
  validateGuideContent,
  validateGuideTopic,
  calculateKeywordOverlap,
  checkCannibalization,
  validateAllGuides,
  logValidationResults,
} from './validation'
