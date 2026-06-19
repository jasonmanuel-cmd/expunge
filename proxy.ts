import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/consumer',
  '/upload',
  '/checkout',
  '/billing',
  '/partner',
]

// Paths that should redirect to dashboard if already logged in
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Safety net: if a confirmation / OAuth link lands anywhere other than the
  // callback with a ?code (e.g. Supabase Site URL points at "/"), forward it
  // to /auth/callback so the session can still be exchanged.
  const code = request.nextUrl.searchParams.get('code')
  if (code && pathname !== '/auth/callback') {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    const next = request.nextUrl.searchParams.get('next')
    if (next) callbackUrl.searchParams.set('next', next)
    return NextResponse.redirect(callbackUrl)
  }

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    // Honor upgrade intent: a logged-in user who clicked a paid-plan CTA
    // (e.g. /register?plan=pro) should go straight to checkout, not be
    // bounced to the dashboard and lose the plan they selected.
    const plan = request.nextUrl.searchParams.get('plan')
    if (plan && ['basic', 'pro', 'partner'].includes(plan)) {
      return NextResponse.redirect(new URL(`/checkout?plan=${plan}`, request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect unauthenticated users to login
  if (!user && PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Role-based access: partner routes
  if (pathname.startsWith('/partner') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'partner' && profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
