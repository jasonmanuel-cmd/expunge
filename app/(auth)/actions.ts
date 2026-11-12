'use server'

import { cookies } from 'next/headers'
import {
  appUrl,
  createLinkToken,
  endSession,
  getSessionUser,
  startSession,
} from '@/lib/auth'
import {
  authenticate,
  findUserByEmail,
  registerAccount,
  resetPasswordWithToken,
  type RegisterInput,
} from '@/lib/auth-flows'
import { canSendAuthEmail, sendConfirmEmail, sendPasswordResetEmail } from '@/lib/email'

/**
 * Server actions behind the sign-in pages. They replace the supabase.auth.*
 * calls the pages used to make from the browser.
 */

/** Email confirmation is on unless AUTH_EMAIL_CONFIRMATION=off. */
function confirmationRequired(): boolean {
  return process.env.AUTH_EMAIL_CONFIRMATION !== 'off'
}

/** Where to go after confirming: set by the register form, same as before. */
async function rememberNext(next: string | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return
  const store = await cookies()
  store.set('expunge_next', next, { path: '/', maxAge: 600, sameSite: 'lax' })
}

async function sendConfirmLink(userId: string, email: string): Promise<boolean> {
  const token = await createLinkToken(userId, 'confirm')
  if (!token) return true // rate-limited: say it was sent, don't send more
  return sendConfirmEmail(email, `${await appUrl()}/auth/callback?token=${token}&type=confirm`)
}

export async function signInAction(email: string, password: string) {
  const result = await authenticate(email, password)
  if (!result.ok) return { error: result.error, needsConfirm: !!result.needsConfirm }
  await startSession(result.userId)
  return { error: null, needsConfirm: false }
}

export async function signUpAction(input: RegisterInput & { next?: string }) {
  const needConfirm = confirmationRequired()
  if (needConfirm && !canSendAuthEmail()) {
    return { error: 'Sign-up email is not set up yet. Please contact support.', emailSent: false, signedIn: false }
  }

  const result = await registerAccount(input, { confirmed: !needConfirm })
  if (!result.ok) return { error: result.error, emailSent: false, signedIn: false }

  if (result.existing) {
    // Don't reveal that the email is taken. If it was never confirmed, send a fresh link.
    if (result.userId && !result.confirmed && needConfirm) {
      await rememberNext(input.next)
      await sendConfirmLink(result.userId, input.email.trim().toLowerCase())
    }
    return { error: null, emailSent: true, signedIn: false }
  }

  if (!needConfirm) {
    await startSession(result.userId)
    return { error: null, emailSent: false, signedIn: true }
  }

  await rememberNext(input.next)
  const sent = await sendConfirmLink(result.userId, input.email.trim().toLowerCase())
  if (!sent) {
    return {
      error: 'Your account was created but the confirmation email could not be sent. Use "Resend confirmation email" on the sign-in page.',
      emailSent: false,
      signedIn: false,
    }
  }
  return { error: null, emailSent: true, signedIn: false }
}

export async function resendConfirmationAction(email: string) {
  const user = await findUserByEmail(email)
  if (user && !user.email_confirmed_at) {
    const sent = await sendConfirmLink(user.id, user.email)
    if (!sent) return { error: 'The confirmation email could not be sent. Please try again later.' }
  }
  return { error: null }
}

export async function requestPasswordResetAction(email: string) {
  if (!canSendAuthEmail()) {
    return { error: 'Password reset email is not set up yet. Please contact support.' }
  }
  const user = await findUserByEmail(email)
  if (user) {
    const token = await createLinkToken(user.id, 'reset')
    if (token) {
      const sent = await sendPasswordResetEmail(user.email, `${await appUrl()}/reset-password?token=${token}`)
      if (!sent) return { error: 'The reset email could not be sent. Please try again later.' }
    }
  }
  // Same answer whether or not the email has an account.
  return { error: null }
}

export async function resetPasswordAction(token: string, password: string) {
  const result = await resetPasswordWithToken(token, password)
  return { error: result.ok ? null : result.error }
}

export async function signOutAction() {
  await endSession()
  return { error: null }
}

/** For client pages that only need to know who is signed in. */
export async function currentUserAction() {
  const user = await getSessionUser()
  return user ? { id: user.id, email: user.email, role: user.role } : null
}
