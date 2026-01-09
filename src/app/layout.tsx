import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { GlobalProvider } from "@/contexts/GlobalContext"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata, Viewport } from "next"
import { Toaster } from "sonner"
import "./globals.css"

const siteConfig = {
  name: "Stamina Timer",
  description: "The science-backed training app that helps men build lasting stamina and control. Track your progress, understand your patterns, and see real improvement in weeks.",
  url: "https://staminatimer.com",
  ogImage: "/og-image.png",
  keywords: [
    "stamina training",
    "stamina timer",
    "endurance training",
    "performance improvement",
    "stamina control",
    "edging timer",
    "stamina tracker",
    "male stamina",
    "lasting longer",
    "sexual health",
    "performance anxiety",
    "stamina exercises"
  ],
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
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
  authors: [{ name: "Stamina Timer Team" }],
  creator: "Stamina Timer",
  publisher: "Stamina Timer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
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
    card: "summary_large_image",
    title: `${siteConfig.name} - Build Lasting Stamina & Control`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@staminatimer",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
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
  category: "health",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Albert+Sans:ital,wght@0,100..900;1,100..900&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <GlobalProvider>
              <div className="relative min-h-screen bg-[url('/background.png')] bg-cover bg-center bg-no-repeat bg-fixed">
                <div className="relative z-10">
                  {children}
                  <Toaster />
                  <SpeedInsights />
                  <Analytics />
                  <ServiceWorkerRegistrar />
                </div>
              </div>
            </GlobalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
