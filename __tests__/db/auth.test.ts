/**
 * Sign-in that replaces Supabase Auth, tested against a real Postgres.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import type { PGlite } from '@electric-sql/pglite'
import { cookieJar, cookieStore, makeFirm, makeTestDb, signInAs } from './helpers'

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers({ host: 'localhost:3000' }),
}))

import {
  authenticate,
  BAD_LOGIN,
  confirmEmailToken,
  registerAccount,
  resetPasswordWithToken,
} from '@/lib/auth-flows'
import { createLinkToken, getSessionUser, userForSessionToken, createSessionToken } from '@/lib/auth'

let pg: PGlite

beforeAll(async () => {
  ;({ pg } = await makeTestDb())
})
beforeEach(() => cookieJar.clear())

const base = { password: 'correct-horse-9', fullName: 'Test Person', role: 'consumer' as const }

describe('registerAccount', () => {
  it('creates the user, profile and free subscription in one go', async () => {
    const r = await registerAccount({ ...base, email: 'New.Person@Example.com' }, { confirmed: true })
    expect(r.ok && !r.existing).toBe(true)
    if (!r.ok || r.existing) return
    const row = (
      await pg.query<{ email: string; role: string; plan: string }>(
        `select u.email, p.role, s.plan::text as plan from users u join profiles p on p.id = u.id
           join subscriptions s on s.user_id = u.id where u.id = $1`,
        [r.userId]
      )
    ).rows[0]
    expect(row).toEqual({ email: 'new.person@example.com', role: 'consumer', plan: 'free' })
  })

  it('links an invited client to the firm that owns the code', async () => {
    const firm = await makeFirm(pg, 'Invite Firm', [])
    const r = await registerAccount({ ...base, email: 'invited@example.com', inviteCode: firm.code.toUpperCase() }, { confirmed: true })
    if (!r.ok || r.existing) throw new Error('expected a new account')
    const link = await pg.query(`select 1 from partner_clients where partner_id = $1 and consumer_id = $2`, [firm.firmId, r.userId])
    expect(link.rows.length).toBe(1)
  })

  it("never makes an admin, and doesn't link a firm sign-up to another firm", async () => {
    const firm = await makeFirm(pg, 'Other Firm', [])
    const r = await registerAccount(
      { ...base, email: 'sneaky@example.com', role: 'admin' as never, inviteCode: firm.code },
      { confirmed: true }
    )
    if (!r.ok || r.existing) throw new Error('expected a new account')
    const p = await pg.query<{ role: string }>(`select role from profiles where id = $1`, [r.userId])
    expect(p.rows[0].role).toBe('consumer')

    const f = await registerAccount({ ...base, email: 'firm2@example.com', role: 'partner', inviteCode: firm.code }, { confirmed: true })
    if (!f.ok || f.existing) throw new Error('expected a new account')
    const link = await pg.query(`select 1 from partner_clients where consumer_id = $1`, [f.userId])
    expect(link.rows.length).toBe(0)
  })

  it('a taken email changes nothing and gives the same answer', async () => {
    const r = await registerAccount({ ...base, email: 'NEW.person@example.com', password: 'different-pass-1' }, { confirmed: true })
    expect(r.ok && r.existing).toBe(true)
    expect(await authenticate('new.person@example.com', 'correct-horse-9')).toMatchObject({ ok: true })
  })
})

describe('authenticate', () => {
  it('accepts a password hash copied from Supabase ($2a$10 bcrypt)', async () => {
    const legacy = bcrypt.hashSync('old-supabase-pass', 10).replace(/^\$2b\$/, '$2a$')
    expect(legacy.startsWith('$2a$10$')).toBe(true)
    await pg.query(`insert into users (email, password_hash, email_confirmed_at) values ('legacy@example.com', $1, now())`, [legacy])
    expect(await authenticate('Legacy@Example.com', 'old-supabase-pass')).toMatchObject({ ok: true })
    expect(await authenticate('legacy@example.com', 'wrong')).toEqual({ ok: false, error: BAD_LOGIN })
  })

  it('gives the same answer for an unknown email as for a wrong password', async () => {
    expect(await authenticate('nobody@example.com', 'whatever-1')).toEqual({ ok: false, error: BAD_LOGIN })
  })

  it('refuses an unconfirmed email until the confirm link is used, once', async () => {
    const r = await registerAccount({ ...base, email: 'unconfirmed@example.com' }, { confirmed: false })
    if (!r.ok || r.existing) throw new Error('expected a new account')
    expect(await authenticate('unconfirmed@example.com', base.password)).toMatchObject({ ok: false, needsConfirm: true })
    const token = await createLinkToken(r.userId, 'confirm')
    expect(await confirmEmailToken(token)).toBe(r.userId)
    expect(await confirmEmailToken(token)).toBeNull()
    expect(await authenticate('unconfirmed@example.com', base.password)).toMatchObject({ ok: true })
  })

  it('locks an email after 10 failed tries', async () => {
    await registerAccount({ ...base, email: 'locked@example.com' }, { confirmed: true })
    for (let i = 0; i < 10; i++) await authenticate('locked@example.com', `bad-${i}`)
    const r = await authenticate('locked@example.com', base.password)
    expect(r.ok).toBe(false)
    expect(r.ok ? '' : r.error).toMatch(/Too many/)
  })
})

describe('password reset', () => {
  it('a reset link works once, signs out other sessions, and a confirm link is not a reset link', async () => {
    const r = await registerAccount({ ...base, email: 'reset@example.com' }, { confirmed: true })
    if (!r.ok || r.existing) throw new Error('expected a new account')
    const oldSession = await createSessionToken(r.userId)

    const confirm = await createLinkToken(r.userId, 'confirm')
    expect((await resetPasswordWithToken(confirm, 'brand-new-pass-1')).ok).toBe(false)

    const reset = await createLinkToken(r.userId, 'reset')
    expect((await resetPasswordWithToken(reset, 'brand-new-pass-1')).ok).toBe(true)
    expect((await resetPasswordWithToken(reset, 'another-pass-22')).ok).toBe(false)

    expect(await userForSessionToken(oldSession)).toBeNull()
    expect(await authenticate('reset@example.com', 'brand-new-pass-1')).toMatchObject({ ok: true })
    expect(await authenticate('reset@example.com', base.password)).toMatchObject({ ok: false })
  })

  it('stops handing out links after 5 in an hour', async () => {
    const r = await registerAccount({ ...base, email: 'spam@example.com' }, { confirmed: true })
    if (!r.ok || r.existing) throw new Error('expected a new account')
    for (let i = 0; i < 5; i++) expect(await createLinkToken(r.userId, 'reset')).toBeTruthy()
    expect(await createLinkToken(r.userId, 'reset')).toBeNull()
  })
})

describe('sessions', () => {
  it('only the hash of the session token is stored', async () => {
    const r = await registerAccount({ ...base, email: 'session@example.com' }, { confirmed: true })
    if (!r.ok || r.existing) throw new Error('expected a new account')
    await signInAs(r.userId)
    const token = cookieJar.get('expunge_session')!
    const stored = await pg.query(`select 1 from sessions where token_hash = $1`, [token])
    expect(stored.rows.length).toBe(0)
    expect((await getSessionUser())?.id).toBe(r.userId)
  })

  it('an expired session is ignored', async () => {
    const r = await registerAccount({ ...base, email: 'expired@example.com' }, { confirmed: true })
    if (!r.ok || r.existing) throw new Error('expected a new account')
    const token = await createSessionToken(r.userId)
    await pg.query(`update sessions set expires_at = now() - interval '1 minute' where user_id = $1`, [r.userId])
    expect(await userForSessionToken(token)).toBeNull()
  })
})
