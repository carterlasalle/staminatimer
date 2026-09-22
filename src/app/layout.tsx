import { ClarityAnalytics } from '@/components/ClarityAnalytics'
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import {
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from '@/components/seo/JsonLd'
import { ThemeProvider } from '@/components/theme-provider'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Metadata, Viewport } from 'next'
import { Albert_Sans, Bricolage_Grotesque } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

/**
 * Both families ship as variable fonts, so the whole weight axis comes from one
 * file per family instead of one per weight.
 *
 * These were previously loaded from `fonts.googleapis.com` with a stylesheet
 * `<link>` in `<head>`, which blocks the first paint on a third-party request
 * (measured at 780 ms on mobile) and delays the LCP element — the header text.
 * `next/font` fetches the font files at build time, serves them from our own
 * origin, preloads them, and generates a metric-matched fallback so swapping in
 * the real font does not shift layout.
 */
const fontBody = Albert_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

/** Vercel's analytics scripts only resolve when those products are enabled for the
 * deployment; render them only when explicitly switched on. */
const VERCEL_ANALYTICS_ENABLED = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === 'true'

const siteConfig = {
  name: 'Stamina Timer',
  description:
    'A private training app for building lasting control. Follow a measured guided program, track your progress, and see how each session compares with your own baseline.',
  url: 'https://staminatimer.com',
  ogImage: '/og-image.png',
  keywords: [
    'stamina training',
    'stamina timer',
    'endurance training',
    'performance improvement',
    'stamina control',
    'stamina tracker',
    'male stamina',
    'lasting longer',
    'sexual health',
    'stamina exercises',
  ],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true, // Enable pinch-to-zoom for accessibility
  viewportFit: 'cover',
  themeColor: [
    // Matches --background in each theme.
    { media: '(prefers-color-scheme: light)', color: '#f6f8f9' },
    { media: '(prefers-color-scheme: dark)', color: '#111518' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} - Build Lasting Stamina & Control`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: 'Stamina Timer Team' }],
  creator: 'Stamina Timer',
  publisher: 'Stamina Timer',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/icons/icon-192x192.png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: siteConfig.name,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: `${siteConfig.name} - Build Lasting Stamina & Control`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Science-backed stamina training`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - Build Lasting Stamina & Control`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@staminatimer',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  alternates: {
    canonical: siteConfig.url,
  },
  category: 'health',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontBody.variable} ${fontDisplay.variable}`}
    >
      <head>
        {/* PWA - iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stamina Timer" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* PWA - Android/Chrome specific */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Stamina Timer" />

        {/* PWA - Microsoft specific */}
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="none" />

        {/* Prevent phone number detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* Disable tap highlight on iOS */}
        <style>{`* { -webkit-tap-highlight-color: transparent; }`}</style>

        {/* Global JSON-LD Structured Data */}
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <SoftwareApplicationJsonLd />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* The auth and session providers live in the (app) route group, not
              here: mounting them globally put `supabase-js` on every public page
              for no benefit. Everything left in this tree is anonymous. */}
          <div className="app-ground min-h-screen">
            <div className="relative z-10">
              {children}
              <Toaster />
              {/* Both scripts 404 unless Web Analytics / Speed Insights are enabled
                  for the deployment, so they only render when explicitly turned on. */}
              {VERCEL_ANALYTICS_ENABLED && (
                <>
                  <SpeedInsights />
                  <Analytics />
                </>
              )}
              <ClarityAnalytics />
              <ServiceWorkerRegistrar />
              <PWAInstallPrompt />
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
