"use client"

import { useEffect } from "react"

// Async font loading to prevent render-blocking
export function FontLoader() {
  useEffect(() => {
    // Create link elements for fonts
    const fontUrl = "https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700&family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap"

    // Check if fonts are already loaded
    if (document.querySelector(`link[href="${fontUrl}"]`)) {
      return
    }

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = fontUrl
    document.head.appendChild(link)
  }, [])

  return null
}
