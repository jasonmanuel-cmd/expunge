import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the session lookup so we control whether a user is "logged in".
let mockUser: { id: string; email: string; role: 'consumer' | 'partner' | 'admin'; full_name: null } | null = null
vi.mock('@/lib/auth', () => ({
  SESSION_COOKIE: 'expunge_session',
  userForSessionToken: async () => mockUser,
}))

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

function withSession(req: NextRequest): NextRequest {
  req.cookies.set('expunge_session', 'x'.repeat(43))
  return req
}

describe('proxy — firm plan intent for logged-in users', () => {
  beforeEach(() => {
    mockUser = { id: 'user-123', email: 'a@example.com', role: 'consumer', full_name: null }
  })

  it('routes an authenticated user clicking a firm-plan CTA to checkout', async () => {
    const req = withSession(new NextRequest(new URL('https://www.expunge.bond/register?plan=partner')))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/checkout?plan=partner')
  })

  it('routes the annual license CTA to checkout', async () => {
    const req = withSession(new NextRequest(new URL('https://www.expunge.bond/register?plan=partner_annual')))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/checkout?plan=partner_annual')
  })

  it('never sends a retired consumer plan (/register?plan=pro) to checkout', async () => {
    const req = withSession(new NextRequest(new URL('https://www.expunge.bond/register?plan=pro')))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/dashboard')
  })

  it('still bounces an authenticated user from a plain /register (no plan) to the dashboard', async () => {
    const req = withSession(new NextRequest(new URL('https://www.expunge.bond/register')))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/dashboard')
  })
})

describe('proxy — signed-out users', () => {
  beforeEach(() => {
    mockUser = null
  })

  it('sends a signed-out visitor on a protected page to login with a redirect back', async () => {
    const res = await proxy(new NextRequest(new URL('https://www.expunge.bond/dashboard')))
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/login?redirect=%2Fdashboard')
  })

  it('keeps a client away from the firm dashboard', async () => {
    mockUser = { id: 'user-123', email: 'a@example.com', role: 'consumer', full_name: null }
    const res = await proxy(withSession(new NextRequest(new URL('https://www.expunge.bond/partner/dashboard'))))
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/dashboard')
  })
})
