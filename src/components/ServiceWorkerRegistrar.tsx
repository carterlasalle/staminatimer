'use client'

import { useEffect } from 'react';

/**
 * ServiceWorkerRegistrar Component
 *
 * This component is responsible for registering the service worker.
 * It uses the useEffect hook, which requires it to be a Client Component.
 * It should be included in the root layout to ensure the service worker is registered on application load.
 * Update this file if the service worker path ('/sw.js') changes or if registration logic needs modification.
 */
export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .catch(() => {
          // Service worker registration failed silently in production
          // Errors are expected when offline or in certain browser configurations
        });
    }
  }, []);

  return null;
}
