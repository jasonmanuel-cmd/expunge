import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { PLAN_IDS } from '@/lib/square/client'
import { isFirmBillingKey } from '@/lib/pricing'
import CheckoutForm from './CheckoutForm'

/**
 * Checkout is for firm accounts only. Expunge has no consumer plans, so anyone
 * else is sent back to their dashboard. The API route checks the role again.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login?redirect=/checkout')

  if (user.role !== 'partner' && user.role !== 'admin') redirect('/dashboard')

  const raw = (await searchParams).plan
  const requested = Array.isArray(raw) ? raw[0] : raw
  const planKey = isFirmBillingKey(requested) ? requested : 'partner'

  // The annual license can also be sold by invoice. Until its Square plan
  // exists, send firms to the license request form instead of a dead checkout.
  if (!PLAN_IDS[planKey]) redirect(planKey === 'partner_annual' ? '/demo?interest=license' : '/demo')

  return <CheckoutForm planKey={planKey} />
}
