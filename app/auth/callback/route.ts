import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase email-confirmation and OAuth redirects.
// Email confirmation links arrive as ?token_hash=...&type=signup
// OAuth / magic-link PKCE arrives as ?code=...
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  const supabase = await createClient()

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, origin))
    }
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, origin)
    )
  }

  return NextResponse.redirect(
    new URL('/login?error=Invalid+or+expired+confirmation+link', origin)
  )
}
