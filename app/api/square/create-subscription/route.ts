import { NextRequest, NextResponse } from 'next/server'
import { squareClient, LOCATION_ID, PLAN_IDS } from '@/lib/square/client'
import { getSessionUser } from '@/lib/auth'
import { insert, q1 } from '@/lib/db'
import { isFirmBillingKey, seatsForBillingKey } from '@/lib/pricing'

// Only firms can pay Expunge. Consumers (including firm-invited clients) can
// never start a subscription: the role check below enforces it server-side.

export async function POST(req: NextRequest) {
  try {
    // Verify authenticated user
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planKey, sourceId, userId, email } = await req.json() as {
      planKey: unknown; sourceId: string; userId: string; email: string
    }

    // Verify the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isFirmBillingKey(planKey)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    const planVariationId = PLAN_IDS[planKey]
    if (!planVariationId) {
      return NextResponse.json({ error: 'This plan is not available for card checkout yet.' }, { status: 400 })
    }

    if (user.role !== 'partner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Only firm accounts can subscribe.' }, { status: 403 })
    }

    // Check if Square customer already exists for this user
    const existingSub = await q1<{ square_customer_id: string | null; square_subscription_id: string | null }>(
      `select square_customer_id, square_subscription_id from subscriptions where user_id = $1`,
      [userId]
    )

    let customerId = existingSub?.square_customer_id

    // Create Square customer if new
    if (!customerId) {
      const custResult = await squareClient.customers.create({
        emailAddress: email,
        referenceId: userId,
        note: 'Expunge firm account',
      })
      customerId = custResult.customer?.id
      if (!customerId) throw new Error('Failed to create Square customer')
    }

    // Create card on file
    const cardResult = await squareClient.cards.create({
      idempotencyKey: `${userId}-${Date.now()}`,
      sourceId,
      card: { customerId },
    })
    const cardId = cardResult.card?.id
    if (!cardId) throw new Error('Failed to store card')

    // Create subscription
    const startDate = new Date()
    const subResult = await squareClient.subscriptions.create({
      idempotencyKey: `sub-${userId}-${planKey}-${Date.now()}`,
      locationId: LOCATION_ID,
      planVariationId,
      customerId,
      cardId,
      startDate: startDate.toISOString().split('T')[0],
    })

    const squareSubId = subResult.subscription?.id
    if (!squareSubId) throw new Error('Failed to create subscription')

    // Plan change: only cancel the old subscription once the new one exists, so a
    // failed card never leaves the customer with no plan. Square ends the old one
    // at the end of its paid period (no further charges).
    const oldSubId = existingSub?.square_subscription_id
    if (oldSubId && oldSubId !== squareSubId) {
      try {
        await squareClient.subscriptions.cancel({ subscriptionId: oldSubId })
      } catch (cancelErr) {
        console.error('Plan change: could not cancel old subscription', oldSubId, cancelErr)
      }
    }

    // Save it. Monthly and annual both grant the one firm plan.
    const annual = planKey === 'partner_annual'
    await insert('subscriptions', {
      user_id: userId,
      plan: 'partner',
      status: 'active',
      square_customer_id: customerId,
      square_subscription_id: squareSubId,
      square_card_id: cardId,
      current_period_start: startDate.toISOString(),
      current_period_end: (annual
        ? new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate())
        : new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate())
      ).toISOString(),
      cancel_at_period_end: false,
      client_seats: seatsForBillingKey(planKey),
    }, {
      onConflict: `on conflict (user_id) do update set
        plan = excluded.plan, status = excluded.status,
        square_customer_id = excluded.square_customer_id,
        square_subscription_id = excluded.square_subscription_id,
        square_card_id = excluded.square_card_id,
        current_period_start = excluded.current_period_start,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = excluded.cancel_at_period_end,
        client_seats = excluded.client_seats`,
    })

    return NextResponse.json({ success: true, plan: planKey })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Subscription creation failed'
    console.error('Square create-subscription error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
