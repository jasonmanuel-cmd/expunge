import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, userForSessionToken } from '@/lib/auth'

// Paths that require authentication
const PROTECTED_PATHS = [
  '/dashboard',
  '/consumer',
  '/upload',
  '/checkout',
  '/billing',
  '/partner',
]

// Paths that should redirect to dashboard if already logged in.
// (/reset-password is not here: a reset link must work even while signed in.)
const AUTH_PATHS = ['/login', '/register', '/forgot-password']

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const pathname = request.nextUrl.pathname

  // Only look up the session where it matters (protected and auth pages).
  const needsUser =
    PROTECTED_PATHS.some((p) => pathname.startsWith(p)) || AUTH_PATHS.some((p) => pathname.startsWith(p))
  if (!needsUser) return response

  const user = await userForSessionToken(request.cookies.get(SESSION_COOKIE)?.value).catch((err) => {
    console.error('[proxy] session lookup failed:', err)
    return null
  })

  // Redirect authenticated users away from auth pages
  if (user && AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    // Honor firm-plan intent: a logged-in user who clicked a firm-plan CTA
    // (e.g. /register?plan=partner) goes to checkout, which only lets firm
    // accounts through. There are no consumer plans.
    const plan = request.nextUrl.searchParams.get('plan')
    if (plan && ['partner', 'partner_annual'].includes(plan)) {
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
    if (user.role !== 'partner' && user.role !== 'admin') {
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
