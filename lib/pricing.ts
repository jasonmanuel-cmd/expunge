/**
 * Firm pricing. Expunge is sold only to businesses: there is no consumer plan
 * and no way for a consumer to pay. Change prices here and nowhere else.
 *
 * Every firm offer maps to the same database plan, 'partner'. The billing key
 * says how the firm pays:
 *   - 'partner'        monthly Square subscription (SQUARE_PLAN_PARTNER_ID)
 *   - 'partner_annual' yearly flat license, as a yearly Square subscription
 *                      (SQUARE_PLAN_FIRM_ANNUAL_ID) or by invoice
 *
 * Prices here are display text and checkout copy. What Square actually charges
 * is set on the plan in Square, so a price change here also needs a new plan
 * variation in Square with the same amount.
 */

export type FirmBillingKey = 'partner' | 'partner_annual'

export interface FirmOffer {
  key: FirmBillingKey | 'custom'
  name: string
  /** Amount in cents, or null for a quoted price. */
  priceCents: number | null
  priceLabel: string
  /** Short unit shown beside a big price, e.g. "/mo". */
  unit: string
  billedAs: string
  description: string
  features: string[]
}

export const FIRM_MONTHLY: FirmOffer = {
  key: 'partner',
  name: 'Firm Monthly',
  priceCents: 29900,
  priceLabel: '$299/mo',
  unit: '/mo',
  billedAs: 'billed monthly, cancel any time',
  description: 'For a single firm or office.',
  features: [
    'Unlimited client logins from your invite link',
    'Your firm name and logo on client pages',
    'Dashboard with every client and their disputes',
    'Report review and letter drafting',
    'Follow-up tracking and reminders',
    'Email support',
  ],
}

export const FIRM_ANNUAL: FirmOffer = {
  key: 'partner_annual',
  name: 'Annual License',
  priceCents: 299000,
  priceLabel: '$2,990/yr',
  unit: '/yr',
  billedAs: 'one flat payment per year, card or invoice',
  description: 'Everything in Firm Monthly for one flat yearly fee. Two months free.',
  features: [
    'Everything in Firm Monthly',
    'One payment a year, no monthly charges',
    'Pay by card or by invoice',
    'Priority onboarding call',
  ],
}

export const FIRM_CUSTOM: FirmOffer = {
  key: 'custom',
  name: 'White-label or buyout',
  priceCents: null,
  priceLabel: 'Custom',
  unit: '',
  billedAs: 'quoted per deal',
  description: 'For networks, franchises and companies that want to run it under their own brand or own a copy outright.',
  features: [
    'Multiple offices under one account',
    'Your own domain and brand',
    'Source-code license or outright purchase',
    'Setup and handover support',
  ],
}

export const FIRM_OFFERS = [FIRM_MONTHLY, FIRM_ANNUAL, FIRM_CUSTOM] as const

/** Offers a firm can pay for at checkout, by billing key. */
export const CHECKOUT_OFFERS: Record<FirmBillingKey, FirmOffer> = {
  partner: FIRM_MONTHLY,
  partner_annual: FIRM_ANNUAL,
}

export function isFirmBillingKey(value: unknown): value is FirmBillingKey {
  return value === 'partner' || value === 'partner_annual'
}

/**
 * Names for plans that can no longer be bought. Rows created before the
 * firms-only change may still say 'free', 'basic' or 'pro'; they are shown by
 * name so the account page doesn't break, and can only be canceled.
 */
export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: 'No plan',
  basic: 'Basic (retired)',
  pro: 'Pro (retired)',
  partner: 'Firm',
}
