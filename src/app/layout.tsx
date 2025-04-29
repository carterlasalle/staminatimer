import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/AuthContext"
import { GlobalProvider } from "@/contexts/GlobalContext"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Metadata } from "next"
import { Toaster } from "sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Stamina Timer",
  description: "Track and improve your stamina"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <GlobalProvider>
              {children}
              <Toaster />
              <SpeedInsights />
              <Analytics />
              <ServiceWorkerRegistrar />
            </GlobalProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
