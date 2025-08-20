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
  description: "Track and improve your stamina",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico"
  },
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
