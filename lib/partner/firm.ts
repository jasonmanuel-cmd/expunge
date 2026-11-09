// Pure helpers for firm (partner) accounts. No I/O here so they can be unit tested.
import { randomBytes } from 'crypto'

const INVITE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no 0/o/1/l/i

/** Random, unguessable invite code (lowercase, 12 chars, ~59 bits). */
export function generateInviteCode(length = 12): string {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i++) out += INVITE_ALPHABET[bytes[i] % INVITE_ALPHABET.length]
  return out
}

/** Normalizes a code from a URL; returns null when it can't be a valid code. */
export function normalizeInviteCode(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const code = raw.trim().toLowerCase()
  return /^[a-z0-9]{10,32}$/.test(code) ? code : null
}

/** Trims a firm name; returns null when it's too short or too long. */
export function normalizeFirmName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.replace(/\s+/g, ' ').trim()
  return name.length >= 2 && name.length <= 120 ? name : null
}

/**
 * Accepts only plain https image URLs for a firm logo.
 * Returns '' for "no logo", null for an invalid value.
 */
export function normalizeLogoUrl(raw: unknown): string | null {
  if (raw === undefined || raw === null) return ''
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (value === '') return ''
  if (value.length > 500) return null
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

export type OwnPlan = 'free' | 'basic' | 'pro' | 'partner'

/**
 * True when a subscription row gives the firm an active firm plan.
 *
 * A firm can pay by Square subscription (monthly or yearly) or by invoice. An
 * invoiced license has no Square subscription, so nothing would ever mark it
 * expired; it is active only until its current_period_end. Rows paid through
 * Square are kept current by the webhook, so their period end is not checked.
 */
export function isFirmPlanActive(
  plan: string | null | undefined,
  status: string | null | undefined,
  license?: { periodEnd?: string | null; squareSubscriptionId?: string | null; now?: Date },
): boolean {
  if (plan !== 'partner' || (status !== 'active' && status !== 'trialing')) return false
  if (license && !license.squareSubscriptionId && license.periodEnd) {
    const end = new Date(license.periodEnd)
    if (!Number.isNaN(end.getTime()) && end.getTime() < (license.now ?? new Date()).getTime()) return false
  }
  return true
}

/**
 * The plan a client actually gets. Clients never pay Expunge: a client whose
 * firm has an active firm plan gets full features, paid by the firm. A paid
 * plan of their own only exists on accounts from before the firms-only change
 * (retired Basic/Pro) and is honored until it ends.
 */
export function resolveEffectivePlan(input: {
  ownPlan: OwnPlan
  ownActive: boolean
  firmActive: boolean
}): { plan: OwnPlan; sponsored: boolean } {
  const own = input.ownActive ? input.ownPlan : 'free'
  if (own !== 'free') return { plan: own, sponsored: false }
  if (input.firmActive) return { plan: 'pro', sponsored: true }
  return { plan: 'free', sponsored: false }
}
