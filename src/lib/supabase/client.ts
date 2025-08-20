import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anon) {
  // Throwing helps surface misconfiguration early in dev/build
  throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
}

// Use createBrowserClient for client-side components
export const supabase = createBrowserClient<Database>(url, anon)
