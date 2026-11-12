import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { cookies, headers } from 'next/headers'
import { q, q1, type Querier } from '@/lib/db'

/**
 * Expunge's own sign-in (replaces Supabase Auth).
 *
 * - Passwords: bcrypt. Supabase stored bcrypt hashes too, so hashes copied
 *   from auth.users.encrypted_password verify here unchanged.
 * - Sessions: a random token in an httpOnly cookie; only its SHA-256 hash is
 *   stored in the sessions table.
 * - Email confirm / password reset: one-time tokens in auth_tokens, also
 *   stored hashed.
 */

export const SESSION_COOKIE = 'expunge_session'
const SESSION_DAYS = 30
const BCRYPT_ROUNDS = 12

export type Role = 'consumer' | 'partner' | 'admin'

export interface SessionUser {
  id: string
  email: string
  role: Role
  full_name: string | null
}

// ---------------------------------------------------------------------------
// Tokens and passwords
// ---------------------------------------------------------------------------

export function newToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function isToken(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{40,60}$/.test(v)
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  if (!hash || !hash.startsWith('$2')) return false
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

export function normalizeEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null
  const e = email.trim().toLowerCase()
  if (e.length < 3 || e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null
  return e
}

// ---------------------------------------------------------------------------
// Sessions (token-level; no cookies here, so tests and proxy can use them)
// ---------------------------------------------------------------------------

/** Look up the signed-in user for a raw session token. */
export async function userForSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!isToken(token)) return null
  return q1<SessionUser & Record<string, unknown>>(
    `select u.id, u.email, coalesce(p.role, 'consumer') as role, p.full_name
       from sessions s
       join users u on u.id = s.user_id
       left join profiles p on p.id = u.id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hashToken(token)]
  )
}

export async function createSessionToken(userId: string, on?: Querier): Promise<string> {
  const token = newToken()
  await q(
    `insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + make_interval(days => $3))`,
    [hashToken(token), userId, SESSION_DAYS],
    on
  )
  return token
}

export async function deleteSessionToken(token: string | undefined | null): Promise<void> {
  if (isToken(token)) await q(`delete from sessions where token_hash = $1`, [hashToken(token)])
}

// ---------------------------------------------------------------------------
// One-time links (confirm email, reset password)
// ---------------------------------------------------------------------------

const TOKEN_TTL_MINUTES = { confirm: 24 * 60, reset: 60 } as const
type LinkKind = keyof typeof TOKEN_TTL_MINUTES

/** At most this many links of one kind per user per hour. */
const MAX_LINKS_PER_HOUR = 5

export async function createLinkToken(userId: string, kind: LinkKind, on?: Querier): Promise<string | null> {
  const recent = await q1<{ n: number }>(
    `select count(*)::int as n from auth_tokens where user_id = $1 and kind = $2 and created_at > now() - interval '1 hour'`,
    [userId, kind],
    on
  )
  if ((recent?.n ?? 0) >= MAX_LINKS_PER_HOUR) return null
  const token = newToken()
  await q(
    `insert into auth_tokens (token_hash, user_id, kind, expires_at)
     values ($1, $2, $3, now() + make_interval(mins => $4))`,
    [hashToken(token), userId, kind, TOKEN_TTL_MINUTES[kind]],
    on
  )
  return token
}

/** Uses up a link. Returns the user id, or null if it's unknown, used or expired. */
export async function consumeLinkToken(token: unknown, kind: LinkKind, on?: Querier): Promise<string | null> {
  if (!isToken(token)) return null
  const row = await q1<{ user_id: string }>(
    `update auth_tokens set used_at = now()
      where token_hash = $1 and kind = $2 and used_at is null and expires_at > now()
      returning user_id`,
    [hashToken(token), kind],
    on
  )
  return row?.user_id ?? null
}

// ---------------------------------------------------------------------------
// Login throttling: 10 failed tries per email per 15 minutes.
// ---------------------------------------------------------------------------

const MAX_FAILED_LOGINS = 10

export async function tooManyFailedLogins(email: string): Promise<boolean> {
  const row = await q1<{ n: number }>(
    `select count(*)::int as n from login_attempts where email = $1 and at > now() - interval '15 minutes'`,
    [email]
  )
  return (row?.n ?? 0) >= MAX_FAILED_LOGINS
}

export async function recordFailedLogin(email: string): Promise<void> {
  await q(`insert into login_attempts (email) values ($1)`, [email])
  // Keep the table small.
  await q(`delete from login_attempts where at < now() - interval '1 day'`)
}

export async function clearFailedLogins(email: string): Promise<void> {
  await q(`delete from login_attempts where email = $1`, [email])
}

// ---------------------------------------------------------------------------
// Cookie helpers (server components, server actions, route handlers)
// ---------------------------------------------------------------------------

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  }
}

/** The signed-in user, or null. Works in server components and routes. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  return userForSessionToken(store.get(SESSION_COOKIE)?.value)
}

/** Start a session and set the cookie (server actions and route handlers only). */
export async function startSession(userId: string): Promise<void> {
  const token = await createSessionToken(userId)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions())
}

export async function endSession(): Promise<void> {
  const store = await cookies()
  await deleteSessionToken(store.get(SESSION_COOKIE)?.value)
  store.delete(SESSION_COOKIE)
}

/** Base URL for links in emails. */
export async function appUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL
  if (configured) return configured.replace(/\/+$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
