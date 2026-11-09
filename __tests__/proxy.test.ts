import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Supabase SSR client so we control whether a user is "logged in".
let mockUser: { id: string } | null = { id: 'user-123' }
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockUser } }) },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { role: 'consumer' } }) }) }),
    }),
  }),
}))

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

describe('proxy — firm plan intent for logged-in users', () => {
  beforeEach(() => {
    mockUser = { id: 'user-123' }
  })

  it('routes an authenticated user clicking a firm-plan CTA to checkout', async () => {
    const req = new NextRequest(new URL('https://www.expunge.bond/register?plan=partner'))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/checkout?plan=partner')
  })

  it('routes the annual license CTA to checkout', async () => {
    const req = new NextRequest(new URL('https://www.expunge.bond/register?plan=partner_annual'))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/checkout?plan=partner_annual')
  })

  it('never sends a retired consumer plan (/register?plan=pro) to checkout', async () => {
    const req = new NextRequest(new URL('https://www.expunge.bond/register?plan=pro'))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/dashboard')
  })

  it('still bounces an authenticated user from a plain /register (no plan) to the dashboard', async () => {
    const req = new NextRequest(new URL('https://www.expunge.bond/register'))
    const res = await proxy(req)
    expect(res.headers.get('location')).toBe('https://www.expunge.bond/dashboard')
  })
})
