import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
// import { RateLimiter } from '@/lib/security/rateLimiter' // In-memory limiter not suitable for serverless

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  /*
  // Rate limiting - Needs a persistent store (e.g., Redis, DB) for serverless
  const ip = req.ip ?? '127.0.0.1'
  // const { data: attempts, error: rateError } = await supabase.rpc(...) // Example DB approach
  if (rateError) {
    console.error('Rate limit error:', rateError)
  }
  if (attempts && attempts > 100) { // Example: 100 requests per window
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  */

  // IMPORTANT: Avoid adding code between createServerClient and supabase.auth.getUser()
  // as per Supabase docs to prevent hard-to-debug auth issues.

  // Refresh session if expired - Required for Server Components
  // IMPORTANT: Add `.auth.getUser()` function to securely refresh session cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  // Also include API routes like /auth/callback
  const publicRoutes = ['/', '/login', '/license', '/privacy', '/terms', '/auth/callback']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname) ||
                        req.nextUrl.pathname.startsWith('/share/') || // Allow specific share links
                        req.nextUrl.pathname === '/offline.html' || // Allow offline page
                        req.nextUrl.pathname.startsWith('/api/') // Allow general API routes if any

  // If user is not signed in and the route is protected, redirect to login
  if (!user && !isPublicRoute) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object.
  // Do not create a new NextResponse.next() object without copying cookies.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml|sw.js|offline.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', // Added more exclusions
  ],
}
