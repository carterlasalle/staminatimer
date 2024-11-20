import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Rate limiting
  const ip = req.ip ?? '127.0.0.1'
  const rateLimitKey = `rate_limit:${ip}`
  const attempts = await supabase.rpc('increment_rate_limit', { key: rateLimitKey })
  
  if (attempts > 100) { // 100 requests per minute
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // CSRF Protection
  if (req.method !== 'GET') {
    const csrfToken = req.headers.get('x-csrf-token')
    const storedToken = req.cookies.get('csrf-token')
    
    if (!csrfToken || !storedToken || csrfToken !== storedToken.value) {
      return new NextResponse('Invalid CSRF token', { status: 403 })
    }
  }

  // Auth check
  const { data: { session } } = await supabase.auth.getSession()
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/license', '/privacy', '/terms']
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
} 