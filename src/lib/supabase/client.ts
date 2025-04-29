import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

// Use createBrowserClient for client-side components
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)