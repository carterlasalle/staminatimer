/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== 'production'

// Content Security Policy configuration
// In production, we remove 'unsafe-eval' for better XSS protection
// In development, Next.js requires 'unsafe-eval' for Fast Refresh
const cspDirectives = [
  "default-src 'self'",
  // Script-src: Required 'unsafe-inline' for Next.js, 'unsafe-eval' only in dev
  isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'",
  // Style-src: Required for Tailwind and inline styles
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Font-src: Self and Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Img-src: Allow self, data URLs, blobs, and HTTPS images
  "img-src 'self' data: blob: https:",
  // Connect-src: API endpoints and WebSocket connections
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com",
  // Frame ancestors: Prevent clickjacking
  "frame-ancestors 'none'",
  // Base URI: Prevent base tag hijacking
  "base-uri 'self'",
  // Form action: Restrict form submissions
  "form-action 'self'",
  // Upgrade insecure requests in production
  !isDev ? "upgrade-insecure-requests" : "",
].filter(Boolean).join('; ')

const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
