import { SquareClient, SquareEnvironment } from 'square'

export const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})

export const LOCATION_ID = process.env.SQUARE_LOCATION_ID!

export const PLAN_IDS = {
  basic:   process.env.SQUARE_PLAN_BASIC_ID!,
  pro:     process.env.SQUARE_PLAN_PRO_ID!,
  partner: process.env.SQUARE_PLAN_PARTNER_ID!,
} as const

export type PlanKey = keyof typeof PLAN_IDS

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: '$0/mo',
    description: 'Try it out',
    features: [
      '1 case',
      'Up to 3 dispute items',
      'Single bureau',
      'AI letter generation',
    ],
    limit: { cases: 1, items: 3, triBureau: false, escalation: false },
    cta: 'Get started free',
    highlighted: false,
  },
  basic: {
    name: 'Basic',
    price: 4999,
    priceLabel: '$49.99/mo',
    description: 'For individuals starting their journey',
    features: [
      '5 dispute letters/mo',
      'All 3 bureaus',
      'AI analysis + agents',
      '30-day monitoring',
      'Priority support',
    ],
    limit: { cases: 5, items: 15, triBureau: true, escalation: false },
    cta: 'Start free trial',
    highlighted: false,
  },
  pro: {
    name: 'Pro',
    price: 9999,
    priceLabel: '$99.99/mo',
    description: 'For serious credit repair',
    features: [
      'Unlimited disputes',
      'All 3 bureaus',
      'Full AI agent suite',
      '30-day monitoring + escalation',
      'Bulk upload',
      'Dedicated support',
    ],
    limit: { cases: 999, items: 999, triBureau: true, escalation: true },
    cta: 'Start free trial',
    highlighted: true,
  },
  partner: {
    name: 'Partner',
    price: 29999,
    priceLabel: '$299.99/mo',
    description: 'For credit repair businesses',
    features: [
      'Everything in Pro',
      'White-label dashboard',
      'Client management',
      'API access',
      'Custom branding',
      'Account manager',
    ],
    limit: { cases: 999, items: 999, triBureau: true, escalation: true },
    cta: 'Contact sales',
    highlighted: false,
  },
} as const
