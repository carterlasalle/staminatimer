export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
      // Service worker registered successfully
    } catch (error) {
      // Service worker registration failed - only log in development
      if (process.env.NODE_ENV === 'development') {
        console.error('SW registration failed:', error)
      }
    }
  }
}
