/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

function getLocalSupabaseSources() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!configuredUrl) return []

  try {
    const url = new URL(configuredUrl)
    if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') return []

    const websocketProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return [url.origin, `${websocketProtocol}//${url.host}`]
  } catch {
    return []
  }
}

const localSupabaseSources = getLocalSupabaseSources()
const usesLocalSupabase = localSupabaseSources.length > 0

// Content Security Policy configuration
// In production, we remove 'unsafe-eval' for better XSS protection.
// Local/CI production builds may connect only to the explicitly configured
// loopback Supabase origin so browser smoke tests exercise the real auth path.
const cspDirectives = [
  "default-src 'self'",
  // Script-src: Required 'unsafe-inline' for Next.js, 'unsafe-eval' only in dev
  // Added clarity.ms domains for Microsoft Clarity analytics
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.clarity.ms https://scripts.clarity.ms"
    : "script-src 'self' 'unsafe-inline' https://www.clarity.ms https://scripts.clarity.ms",
  // Style-src: Required for Tailwind and inline styles
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Font-src: Self and Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Img-src: Allow self, data URLs, blobs, and HTTPS images (added clarity.ms)
  "img-src 'self' data: blob: https: https://www.clarity.ms https://*.clarity.ms",
  // Connect-src: API endpoints and WebSocket connections (added clarity.ms).
  // A loopback source is added only when NEXT_PUBLIC_SUPABASE_URL itself is loopback.
  [
    "connect-src 'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    ...localSupabaseSources,
    'https://generativelanguage.googleapis.com',
    'https://www.clarity.ms',
    'https://*.clarity.ms',
  ].join(' '),
  // Frame ancestors: Prevent clickjacking
  "frame-ancestors 'none'",
  // Base URI: Prevent base tag hijacking
  "base-uri 'self'",
  // Form action: Restrict form submissions
  "form-action 'self'",
  // Worker-src: Required for Clarity web workers
  "worker-src 'self' blob:",
  // Upgrade insecure requests in production, except a production-mode local/CI
  // build whose configured Supabase endpoint is intentionally HTTP loopback.
  !isDev && !usesLocalSupabase ? 'upgrade-insecure-requests' : '',
].filter(Boolean).join('; ')

const nextConfig = {
  reactStrictMode: true,

  // Avoid monorepo/workspace root mis-detection when parent directories contain lockfiles.
  turbopack: {
    root: __dirname,
  },

  // React Compiler - automatic memoization (stable in Next.js 16)
  reactCompiler: true,

  // Turbopack configuration (stable in Next.js 16)
  experimental: {
    // Faster dev restarts with filesystem caching
    turbopackFileSystemCacheForDev: true,
  },

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Content-Security-Policy', value: cspDirectives },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
