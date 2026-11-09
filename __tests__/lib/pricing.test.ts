import { describe, it, expect } from 'vitest'
import { CHECKOUT_OFFERS, FIRM_OFFERS, isFirmBillingKey } from '@/lib/pricing'

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
})
