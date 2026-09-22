import { describe, expect, it } from 'vitest'
import { isMarkdownNegotiable, isPrivatePath, wantsMarkdown } from '@/lib/agent-discovery'

/** The session-gated roots the middleware redirects to login. */
const PRIVATE_ROOTS = ['/ai-coach', '/dashboard', '/program', '/progress', '/settings', '/training']

/** Pages an anonymous visitor (or crawler) is allowed to reach. */
const PUBLIC_PATHS = [
  '',
  '/',
  '/about',
  '/definitely-not-a-page',
  '/guides',
  '/guides/some-slug',
  '/login',
  '/privacy',
]

describe('isPrivatePath', () => {
  it('requires a session for every private root and its sub-paths', () => {
    for (const root of PRIVATE_ROOTS) {
      expect(isPrivatePath(root), `${root} is a private page`).toBe(true)
      expect(
        isPrivatePath(`${root}/anything/here`),
        `${root}/anything/here sits under ${root}`
      ).toBe(true)
    }
  })

  it('does not gate a path that merely starts with the same characters', () => {
    // A prefix match without the trailing slash would redirect all of these to
    // the login page instead of answering them.
    for (const path of [
      '/dashboards',
      '/dashboard-old',
      '/setting',
      '/programs',
      '/trainingX',
      '/my-dashboard',
      '/dashboardx/y',
    ]) {
      expect(isPrivatePath(path), `${path} is a public page`).toBe(false)
    }
  })

  it('leaves public paths and their sub-paths public', () => {
    for (const path of PUBLIC_PATHS) {
      expect(isPrivatePath(path), `${path} is a public page`).toBe(false)
      expect(isPrivatePath(`${path}/x`), `${path}/x is a public page`).toBe(false)
    }
  })
})

describe('isMarkdownNegotiable', () => {
  it('refuses every private path', () => {
    for (const root of PRIVATE_ROOTS) {
      expect(isMarkdownNegotiable(root), root).toBe(false)
      expect(isMarkdownNegotiable(`${root}/x`), `${root}/x`).toBe(false)
    }
  })

  it('refuses paths that are already machine-readable files', () => {
    for (const path of [
      '/robots.txt',
      '/sitemap.xml',
      '/llms.txt',
      '/openapi.json',
      '/favicon.ico',
      '/_next/static/x.css',
    ]) {
      expect(isMarkdownNegotiable(path), path).toBe(false)
    }
  })

  it('refuses API, auth and well-known routes', () => {
    expect(isMarkdownNegotiable('/api/anything')).toBe(false)
    expect(isMarkdownNegotiable('/auth/callback')).toBe(false)
    expect(isMarkdownNegotiable('/.well-known/agent')).toBe(false)
  })

  it('negotiates routes that only share characters with those roots', () => {
    // `/apiary` and `/author` are not under `/api/` or `/auth/`.
    expect(isMarkdownNegotiable('/apiary')).toBe(true)
    expect(isMarkdownNegotiable('/author')).toBe(true)
    expect(isMarkdownNegotiable('/.well-knownx')).toBe(true)
  })

  it('negotiates public pages, including ones that do not exist', () => {
    // The markdown body of a 404 is the point: an agent probing a missing
    // resource should read a markdown answer, not HTML.
    for (const path of [
      '/',
      '/guides',
      '/guides/some-slug',
      '/privacy',
      '/definitely-not-a-page',
    ]) {
      expect(isMarkdownNegotiable(path), path).toBe(true)
    }
  })
})

describe('wantsMarkdown', () => {
  it('is false without an explicit markdown preference', () => {
    expect(wantsMarkdown(null)).toBe(false)
    expect(wantsMarkdown('')).toBe(false)
    expect(wantsMarkdown('text/html')).toBe(false)
    expect(wantsMarkdown('*/*')).toBe(false)
    expect(wantsMarkdown('application/json')).toBe(false)
  })

  it('is true when markdown is named', () => {
    expect(wantsMarkdown('text/markdown')).toBe(true)
    expect(wantsMarkdown('text/markdown, text/html')).toBe(true)
  })

  it('honours quality values', () => {
    expect(wantsMarkdown('text/html;q=0.9, text/markdown;q=1')).toBe(true)
    expect(wantsMarkdown('text/markdown;q=0.5, text/html;q=1')).toBe(false)
    expect(wantsMarkdown('text/markdown;q=0')).toBe(false)
  })

  it('lets markdown win a tie', () => {
    expect(wantsMarkdown('text/markdown;q=0.25, text/html;q=0.25')).toBe(true)
    expect(wantsMarkdown('text/markdown, text/html')).toBe(true)
  })

  it('reads messy whitespace and case', () => {
    expect(wantsMarkdown('  text/markdown  ')).toBe(true)
    expect(wantsMarkdown(' TEXT/MARKDOWN ')).toBe(true)
    expect(wantsMarkdown('text/markdown ; q=0.8 , text/html ; q=0.4')).toBe(true)
    expect(wantsMarkdown('TEXT/MARKDOWN, TEXT/HTML')).toBe(true)
  })

  it('treats an unparseable quality value as no markdown', () => {
    expect(wantsMarkdown('text/markdown;q=abc')).toBe(false)
  })

  it('takes the highest quality among duplicate media types', () => {
    // Highest rather than last: a trailing low quality must not win.
    expect(wantsMarkdown('text/markdown;q=0.9, text/markdown;q=0.1, text/html;q=0.5')).toBe(true)
    // Highest rather than first: a trailing high quality must win.
    expect(wantsMarkdown('text/markdown;q=0.1, text/markdown;q=0.7, text/html;q=0.5')).toBe(true)
  })
})

describe('wantsMarkdown q-parameter casing (regression)', () => {
  it('parses an uppercase Q parameter the same as q', () => {
    // RFC 9110 parameter names are case-insensitive. Reading `Q=` overnight as
    // an absent parameter defaulted it to q=1 and preferred markdown when the
    // client had actually ranked it lowest.
    expect(wantsMarkdown('text/markdown;Q=0.5, text/html;q=1')).toBe(false)
    expect(wantsMarkdown('text/markdown;q=0.5, text/html;q=1')).toBe(false)

    // And the positive direction still holds for an uppercase Q.
    expect(wantsMarkdown('text/html;q=0.5, text/markdown;Q=1')).toBe(true)
  })
})
