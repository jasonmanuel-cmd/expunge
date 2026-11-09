import { describe, it, expect } from 'vitest'
import {
  generateInviteCode,
  normalizeInviteCode,
  normalizeFirmName,
  normalizeLogoUrl,
  isFirmPlanActive,
  resolveEffectivePlan,
} from '@/lib/partner/firm'

describe('generateInviteCode', () => {
  it('makes a valid, unique code', () => {
    const a = generateInviteCode()
    const b = generateInviteCode()
    expect(a).toMatch(/^[a-z0-9]{12}$/)
    expect(normalizeInviteCode(a)).toBe(a)
    expect(a).not.toBe(b)
  })
})

describe('normalizeInviteCode', () => {
  it('trims and lowercases', () => {
    expect(normalizeInviteCode('  ABCdef234567 ')).toBe('abcdef234567')
  })
  it('rejects bad input', () => {
    expect(normalizeInviteCode('short')).toBeNull()
    expect(normalizeInviteCode('abc-def-ghi-jkl')).toBeNull()
    expect(normalizeInviteCode(123)).toBeNull()
    expect(normalizeInviteCode(undefined)).toBeNull()
  })
})

describe('normalizeFirmName', () => {
  it('collapses whitespace', () => {
    expect(normalizeFirmName('  Smith   Tax  ')).toBe('Smith Tax')
  })
  it('rejects too short or too long', () => {
    expect(normalizeFirmName('A')).toBeNull()
    expect(normalizeFirmName('x'.repeat(121))).toBeNull()
    expect(normalizeFirmName(null)).toBeNull()
  })
})

describe('normalizeLogoUrl', () => {
  it('allows empty as no logo', () => {
    expect(normalizeLogoUrl('')).toBe('')
    expect(normalizeLogoUrl(undefined)).toBe('')
  })
  it('accepts https', () => {
    expect(normalizeLogoUrl('https://firm.com/logo.png')).toBe('https://firm.com/logo.png')
  })
  it('rejects http, credentials and junk', () => {
    expect(normalizeLogoUrl('http://firm.com/logo.png')).toBeNull()
    expect(normalizeLogoUrl('https://user:pw@firm.com/logo.png')).toBeNull()
    expect(normalizeLogoUrl('javascript:alert(1)')).toBeNull()
    expect(normalizeLogoUrl('not a url')).toBeNull()
  })
})

describe('isFirmPlanActive', () => {
  it('needs an active partner plan', () => {
    expect(isFirmPlanActive('partner', 'active')).toBe(true)
    expect(isFirmPlanActive('partner', 'trialing')).toBe(true)
    expect(isFirmPlanActive('partner', 'canceled')).toBe(false)
    expect(isFirmPlanActive('pro', 'active')).toBe(false)
    expect(isFirmPlanActive(undefined, undefined)).toBe(false)
  })

  it('expires an invoiced license on its period end', () => {
    const now = new Date('2026-11-09T00:00:00Z')
    expect(isFirmPlanActive('partner', 'active', { periodEnd: '2027-11-09T00:00:00Z', squareSubscriptionId: null, now })).toBe(true)
    expect(isFirmPlanActive('partner', 'active', { periodEnd: '2026-11-01T00:00:00Z', squareSubscriptionId: null, now })).toBe(false)
  })

  it('leaves Square-billed plans to the webhook, whatever the period end says', () => {
    const now = new Date('2026-11-09T00:00:00Z')
    expect(isFirmPlanActive('partner', 'active', { periodEnd: '2026-11-01T00:00:00Z', squareSubscriptionId: 'sq_123', now })).toBe(true)
    expect(isFirmPlanActive('partner', 'active', { periodEnd: null, squareSubscriptionId: null, now })).toBe(true)
  })
})

describe('resolveEffectivePlan', () => {
  it('keeps an active paid plan of their own', () => {
    expect(resolveEffectivePlan({ ownPlan: 'basic', ownActive: true, firmActive: true }))
      .toEqual({ plan: 'basic', sponsored: false })
  })
  it('covers a free client at pro when the firm is active', () => {
    expect(resolveEffectivePlan({ ownPlan: 'free', ownActive: true, firmActive: true }))
      .toEqual({ plan: 'pro', sponsored: true })
  })
  it('covers a lapsed paid client when the firm is active', () => {
    expect(resolveEffectivePlan({ ownPlan: 'pro', ownActive: false, firmActive: true }))
      .toEqual({ plan: 'pro', sponsored: true })
  })
  it('falls back to free when the firm is not active', () => {
    expect(resolveEffectivePlan({ ownPlan: 'free', ownActive: true, firmActive: false }))
      .toEqual({ plan: 'free', sponsored: false })
  })
})
