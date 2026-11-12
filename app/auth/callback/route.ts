import { NextRequest, NextResponse } from 'next/server'
import { startSession } from '@/lib/auth'
import { confirmEmailToken } from '@/lib/auth-flows'

// Handles the email-confirmation link: /auth/callback?token=...&type=confirm
// The post-confirm redirect comes from ?next= or the expunge_next cookie the
// sign-up action sets.
function safeNext(raw: string | null | undefined): string {
  if (!raw) return '/dashboard'
  let next = raw
  try {
    next = decodeURIComponent(raw)
  } catch {
    return '/dashboard'
  }
  return next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')
  const next = safeNext(searchParams.get('next') ?? request.cookies.get('expunge_next')?.value)

  const userId = token ? await confirmEmailToken(token) : null
  if (!userId) {
    return NextResponse.redirect(
      new URL('/login?error=Invalid+or+expired+confirmation+link', origin)
    )
  }

  await startSession(userId)
  const res = NextResponse.redirect(new URL(next, origin))
  res.cookies.delete('expunge_next')
  return res
}
