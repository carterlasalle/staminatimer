import { Metadata } from "next"
import { Toast } from "@/components/ui/toast"
import "./globals.css"

export const metadata: Metadata = {
  title: "Stamina Timer",
  description: "Track and improve your stamina",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toast />
      </body>
    </html>
  )
}
