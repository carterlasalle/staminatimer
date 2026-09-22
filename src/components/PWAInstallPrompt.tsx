'use client'

import { Button } from '@/components/ui/button'
import { useEffect, useRef, useState } from 'react'
import { X, Download, Share } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  // Whether there is something to offer, and whether the visitor has shown
  // interest. The prompt only appears once both are true.
  const worthOffering = useRef(false)
  const engaged = useRef(false)

  useEffect(() => {
    // Check if already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsStandalone(standalone)

    if (standalone) return

    // Check if iOS
    const iOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    setIsIOS(iOS)

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')

    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)

      if (daysSinceDismissed < 7) return // Don't show for 7 days after dismissal
    }

    // An install prompt is an interruption: it should follow interest, not
    // precede it. It also used to arrive ~3.4 s after load — the browser fires
    // `beforeinstallprompt` early, then a hardcoded 3 s delay ran — which sits
    // squarely inside the largest-contentful-paint window. On a throttled phone
    // the banner therefore *became* the LCP element and pushed LCP from 1.6 s to
    // 5.4 s. Waiting for the first real interaction is the recommended pattern
    // and keeps a late fixed-position element out of the rendering window.
    const maybeReveal = () => {
      if (worthOffering.current && engaged.current) setShowPrompt(true)
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      worthOffering.current = true
      maybeReveal()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS has no install event to wait for, but the same rule applies.
    if (iOS) {
      worthOffering.current = true
    }

    const engagementEvents = ['scroll', 'pointerdown', 'keydown', 'touchstart'] as const

    const handleEngagement = () => {
      engaged.current = true
      engagementEvents.forEach((name) => window.removeEventListener(name, handleEngagement))
      maybeReveal()
    }

    engagementEvents.forEach((name) =>
      window.addEventListener(name, handleEngagement, { passive: true })
    )

    // A reader who never scrolls still deserves an offer eventually; well past
    // the point where it could affect first render.
    const fallback = setTimeout(handleEngagement, 20000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      engagementEvents.forEach((name) => window.removeEventListener(name, handleEngagement))
      clearTimeout(fallback)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setShowPrompt(false)
      }

      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  if (isStandalone || !showPrompt) return null

  return (
    <div className="safe-area-bottom fixed bottom-4 left-4 right-4 z-40 animate-in slide-in-from-bottom-2 duration-300 ease-out-quart md:left-auto md:right-4 md:w-[22rem]">
      <div className="rounded-lg border border-border/60 bg-card shadow-lg">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Install Stamina Timer</h3>
              <p className="text-xs text-muted-foreground">
                {isIOS
                  ? 'Add to your home screen for the full app experience.'
                  : 'Quick access and offline use.'}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 ease-out-quart hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Dismiss install prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isIOS ? (
            <p className="mt-4 flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2.5 text-xs text-muted-foreground">
              <span>Tap</span>
              <Share className="h-3.5 w-3.5" />
              <span>then &quot;Add to Home Screen&quot;</span>
            </p>
          ) : (
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={handleDismiss}>
                Not now
              </Button>
              <Button size="sm" className="flex-1" onClick={handleInstall}>
                <Download className="h-4 w-4" />
                Install
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
