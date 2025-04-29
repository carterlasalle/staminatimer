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
export function ServiceWorkerRegistrar(): null { // Returns null as it renders nothing visible
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') { // Only register in production
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('Service Worker registered with scope:', registration.scope))
        .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, []);

  return null; // This component doesn't render anything itself
} 