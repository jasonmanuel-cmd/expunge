import type { FirmBillingKey } from '@/lib/pricing'
import { SquareClient, SquareEnvironment } from 'square'

export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})

export const LOCATION_ID = process.env.SQUARE_LOCATION_ID!

/**
 * Square plan variation ids for the only things that can be bought: firm plans.
 * There are no consumer plans. Prices and copy live in lib/pricing.ts.
 *   SQUARE_PLAN_PARTNER_ID      monthly firm plan
 *   SQUARE_PLAN_FIRM_ANNUAL_ID  yearly flat license (optional; without it the
 *                               annual license is sold by invoice only)
 */
export const PLAN_IDS: Record<FirmBillingKey, string | undefined> = {
  partner: process.env.SQUARE_PLAN_PARTNER_ID || undefined,
  partner_annual: process.env.SQUARE_PLAN_FIRM_ANNUAL_ID || undefined,
}

export type PlanKey = FirmBillingKey
