import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('🛡️ Middleware - Path:', req.nextUrl.pathname, 'Has Session:', !!session)

  // If user is not signed in and the current path is a protected route
  // redirect the user to /auth/login
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('❌ No session, redirecting to login')
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  // If user is signed in and the current path is /auth/* redirect the user to /dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    console.log('✅ Has session, redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  console.log('✅ Middleware allowing access to:', req.nextUrl.pathname)
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*']
} 