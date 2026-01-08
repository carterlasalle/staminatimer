import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Get environment variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a function to initialize Supabase client to avoid build-time errors
function createSupabaseClient(): SupabaseClient<Database> {
  if (!url || !anon) {
    // During build time or in environments without env vars, return a mock client
    if (typeof window === 'undefined') {
      // Server-side or build time - return a mock to prevent build errors
      // Using type assertion as this is intentionally a placeholder during SSR/build
      return {} as SupabaseClient<Database>
    }
    // Client-side - throw error for actual runtime issues
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return createBrowserClient<Database>(url, anon)
}

// Use createBrowserClient for client-side components
export const supabase = createSupabaseClient()
