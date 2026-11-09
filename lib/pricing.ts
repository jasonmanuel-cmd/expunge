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
 * Each offer includes a number of client seats (clientSeats). A seat is one
 * client linked to the firm. A firm that needs more asks through
 * MORE_SEATS_URL, and its seat count is raised on its subscription row
 * (subscriptions.client_seats), which overrides the plan default.
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
  /**
   * Client seats included: how many clients can be linked to the firm at once.
   * Null for quoted deals, where the seat count is set per agreement.
   */
  clientSeats: number | null
}

export const FIRM_MONTHLY: FirmOffer = {
  key: 'partner',
  name: 'Firm Monthly',
  priceCents: 29900,
  priceLabel: '$299/mo',
  unit: '/mo',
  billedAs: 'billed monthly, cancel any time',
  description: 'For a single firm or office.',
  clientSeats: 50,
  features: [
    'Up to 50 active clients from your invite link',
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
  clientSeats: 100,
  features: [
    'Up to 100 active clients',
    'Everything else in Firm Monthly',
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
  clientSeats: null,
  features: [
    'Client seats sized to your volume',
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

/**
 * Seats for a firm whose subscription row has no seat count saved (rows from
 * before seats existed, or an invoiced license activated without one).
 */
export const DEFAULT_CLIENT_SEATS = FIRM_MONTHLY.clientSeats as number

/** Seats a checkout grants, saved on the firm's subscription row. */
export function seatsForBillingKey(key: FirmBillingKey): number {
  return CHECKOUT_OFFERS[key].clientSeats ?? DEFAULT_CLIENT_SEATS
}

/** Where a firm asks for more seats than its plan includes. */
export const MORE_SEATS_URL = '/demo?interest=seats'

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
