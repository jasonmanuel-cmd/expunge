import { describe, it, expect } from 'vitest'
import { CHECKOUT_OFFERS, FIRM_ANNUAL, FIRM_MONTHLY, FIRM_OFFERS, DEFAULT_CLIENT_SEATS, isFirmBillingKey, seatsForBillingKey } from '@/lib/pricing'

describe('firm pricing', () => {
  it('only firm plans can be bought', () => {
    expect(Object.keys(CHECKOUT_OFFERS).sort()).toEqual(['partner', 'partner_annual'])
    expect(isFirmBillingKey('partner')).toBe(true)
    expect(isFirmBillingKey('partner_annual')).toBe(true)
    for (const retired of ['free', 'basic', 'pro', '', null, undefined, 'PARTNER']) {
      expect(isFirmBillingKey(retired)).toBe(false)
    }
  })

  it('labels match the amounts', () => {
    for (const offer of FIRM_OFFERS) {
      if (offer.priceCents === null) continue
      const dollars = (offer.priceCents / 100).toLocaleString('en-US')
      expect(offer.priceLabel).toBe(`$${dollars}${offer.unit}`)
    }
  })

  it('the annual license includes more client seats than monthly', () => {
    expect(FIRM_MONTHLY.clientSeats).toBeGreaterThan(0)
    expect(FIRM_ANNUAL.clientSeats).toBeGreaterThan(FIRM_MONTHLY.clientSeats as number)
    expect(DEFAULT_CLIENT_SEATS).toBe(FIRM_MONTHLY.clientSeats)
    expect(seatsForBillingKey('partner')).toBe(FIRM_MONTHLY.clientSeats)
    expect(seatsForBillingKey('partner_annual')).toBe(FIRM_ANNUAL.clientSeats)
  })

  it('feature lists show the real seat counts', () => {
    for (const offer of [FIRM_MONTHLY, FIRM_ANNUAL]) {
      expect(offer.features.some((f) => f.includes(`${offer.clientSeats} active clients`))).toBe(true)
    }
  })
})
