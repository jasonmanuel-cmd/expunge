import { q, q1, tx } from '@/lib/db'
import {
  hashPassword,
  verifyPassword,
  normalizeEmail,
  consumeLinkToken,
  tooManyFailedLogins,
  recordFailedLogin,
  clearFailedLogins,
} from '@/lib/auth'
import { normalizeInviteCode } from '@/lib/partner/firm'

/**
 * Sign-up / sign-in logic with no cookies or email sending, so it can be
 * tested against a real Postgres. app/(auth)/actions.ts wraps these.
 */

export const MIN_PASSWORD = 8

export interface RegisterInput {
  email: string
  password: string
  fullName: string
  role: 'consumer' | 'partner'
  inviteCode?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  ssnLast4?: string | null
  dateOfBirth?: string | null
}

export type RegisterResult =
  | { ok: true; userId: string; existing: false; confirmed: boolean }
  | { ok: true; userId: string | null; existing: true; confirmed: boolean }
  | { ok: false; error: string }

function clean(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t ? t.slice(0, max) : null
}

/**
 * Creates the user, their profile (the subscription row comes from the
 * on_profile_created trigger) and, for an invited client, the link to the firm.
 * This is what Supabase's handle_new_user trigger did.
 *
 * An email that is already registered returns existing: true and changes
 * nothing, so the sign-up form can't be used to find out who has an account.
 */
export async function registerAccount(
  input: RegisterInput,
  opts: { confirmed: boolean }
): Promise<RegisterResult> {
  const email = normalizeEmail(input.email)
  if (!email) return { ok: false, error: 'Enter a valid email address.' }
  if (typeof input.password !== 'string' || input.password.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` }
  }
  if (input.password.length > 72) {
    return { ok: false, error: 'Password must be 72 characters or fewer.' }
  }
  const fullName = clean(input.fullName, 120)
  if (!fullName) return { ok: false, error: 'Enter your name.' }

  // Self sign-up can only make a client or a firm, never an admin.
  const role: 'consumer' | 'partner' = input.role === 'partner' ? 'partner' : 'consumer'
  const isClient = role === 'consumer'

  const dob = clean(input.dateOfBirth, 10)
  if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return { ok: false, error: 'Enter a valid date of birth.' }
  const ssn = clean(input.ssnLast4, 4)
  if (ssn && !/^\d{4}$/.test(ssn)) return { ok: false, error: 'SSN last 4 must be 4 digits.' }
  const state = clean(input.state, 2)?.toUpperCase() ?? null

  const existing = await q1<{ id: string; email_confirmed_at: string | null }>(
    `select id, email_confirmed_at from users where lower(email) = $1`,
    [email]
  )
  if (existing) {
    return { ok: true, userId: existing.id, existing: true, confirmed: !!existing.email_confirmed_at }
  }

  const passwordHash = await hashPassword(input.password)
  const invite = isClient ? normalizeInviteCode(input.inviteCode) : null

  try {
    const userId = await tx(async (t) => {
      const user = await q1<{ id: string }>(
        `insert into users (email, password_hash, email_confirmed_at)
         values ($1, $2, case when $3::boolean then now() else null end)
         returning id`,
        [email, passwordHash, opts.confirmed],
        t
      )
      const id = user!.id
      await q(
        `insert into profiles (id, email, full_name, role, address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          email,
          fullName,
          role,
          isClient ? clean(input.addressLine1) : null,
          isClient ? clean(input.addressLine2) : null,
          isClient ? clean(input.city, 100) : null,
          isClient ? state : null,
          isClient ? clean(input.zipCode, 10) : null,
          isClient ? ssn : null,
          isClient ? dob : null,
        ],
        t
      )
      if (invite) {
        await q(
          `insert into partner_clients (partner_id, consumer_id)
           select partner_id, $2 from partner_settings where invite_code = $1
           on conflict do nothing`,
          [invite, id],
          t
        )
      }
      return id
    })
    return { ok: true, userId, existing: false, confirmed: opts.confirmed }
  } catch (err) {
    // Two sign-ups racing on the same email hit the unique index.
    if ((err as { code?: string }).code === '23505') {
      return { ok: true, userId: null, existing: true, confirmed: false }
    }
    throw err
  }
}

export type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string; needsConfirm?: boolean }

export const BAD_LOGIN = 'Invalid login credentials'

export async function authenticate(rawEmail: unknown, password: unknown): Promise<AuthResult> {
  const email = normalizeEmail(rawEmail)
  if (!email || typeof password !== 'string' || !password) return { ok: false, error: BAD_LOGIN }

  if (await tooManyFailedLogins(email)) {
    return { ok: false, error: 'Too many sign-in attempts. Wait 15 minutes, or reset your password.' }
  }

  const user = await q1<{ id: string; password_hash: string; email_confirmed_at: string | null }>(
    `select id, password_hash, email_confirmed_at from users where lower(email) = $1`,
    [email]
  )
  const valid = await verifyPassword(password, user?.password_hash)
  if (!user || !valid) {
    await recordFailedLogin(email)
    return { ok: false, error: BAD_LOGIN }
  }
  if (!user.email_confirmed_at) {
    return { ok: false, error: 'Email not confirmed', needsConfirm: true }
  }
  await clearFailedLogins(email)
  return { ok: true, userId: user.id }
}

/** Confirms the email behind a confirm link. Returns the user id or null. */
export async function confirmEmailToken(token: unknown): Promise<string | null> {
  return tx(async (t) => {
    const userId = await consumeLinkToken(token, 'confirm', t)
    if (!userId) return null
    await q(`update users set email_confirmed_at = coalesce(email_confirmed_at, now()) where id = $1`, [userId], t)
    return userId
  })
}

/**
 * Sets a new password from a reset link and signs the user out everywhere.
 * A reset link also proves the email address, so it confirms it too.
 */
export async function resetPasswordWithToken(token: unknown, password: unknown): Promise<AuthResult> {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` }
  }
  if (password.length > 72) return { ok: false, error: 'Password must be 72 characters or fewer.' }
  const hash = await hashPassword(password)
  const userId = await tx(async (t) => {
    const id = await consumeLinkToken(token, 'reset', t)
    if (!id) return null
    await q(
      `update users set password_hash = $2, email_confirmed_at = coalesce(email_confirmed_at, now()) where id = $1`,
      [id, hash],
      t
    )
    await q(`delete from sessions where user_id = $1`, [id], t)
    return id
  })
  if (!userId) {
    return { ok: false, error: 'This password reset link is invalid or has expired. Please request a new one.' }
  }
  return { ok: true, userId }
}

export async function findUserByEmail(rawEmail: unknown) {
  const email = normalizeEmail(rawEmail)
  if (!email) return null
  return q1<{ id: string; email: string; email_confirmed_at: string | null }>(
    `select id, email, email_confirmed_at from users where lower(email) = $1`,
    [email]
  )
}
