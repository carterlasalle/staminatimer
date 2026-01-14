import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Get environment variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Create a no-op client for SSR/build time that won't throw errors when methods are called.
 * This prevents runtime errors when components try to use Supabase during server rendering.
 */
function createNoOpClient(): SupabaseClient<Database> {
  const noOp = () => Promise.resolve({ data: null, error: null })
  const noOpChain = () => ({
    select: noOpChain,
    insert: noOpChain,
    update: noOpChain,
    delete: noOpChain,
    eq: noOpChain,
    neq: noOpChain,
    gt: noOpChain,
    lt: noOpChain,
    gte: noOpChain,
    lte: noOpChain,
    is: noOpChain,
    in: noOpChain,
    order: noOpChain,
    limit: noOpChain,
    single: noOp,
    maybeSingle: noOp,
    then: (resolve: (value: { data: null; error: null }) => void) => {
      resolve({ data: null, error: null })
      return Promise.resolve({ data: null, error: null })
    },
  })

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithPassword: noOp,
      signInWithOAuth: noOp,
      signUp: noOp,
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => noOpChain(),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    removeChannel: () => Promise.resolve('ok'),
  } as unknown as SupabaseClient<Database>
}

// Create a function to initialize Supabase client to avoid build-time errors
function createSupabaseClient(): SupabaseClient<Database> {
  // Server-side or build time - return a no-op client to prevent errors
  if (typeof window === 'undefined') {
    return createNoOpClient()
  }

  if (!url || !anon) {
    console.error('Missing Supabase environment variables')
    return createNoOpClient()
  }

  return createBrowserClient<Database>(url, anon)
}

// Use createBrowserClient for client-side components
export const supabase = createSupabaseClient()
