import { NextRequest, NextResponse } from 'next/server'
import { squareClient, LOCATION_ID, PLAN_IDS } from '@/lib/square/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isFirmBillingKey, seatsForBillingKey } from '@/lib/pricing'

// Only firms can pay Expunge. Consumers (including firm-invited clients) can
// never start a subscription: the role check below enforces it server-side.

export async function POST(req: NextRequest) {
  try {
    // Verify authenticated user
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
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

    const supabase = createServiceClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()
    if (profile?.role !== 'partner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only firm accounts can subscribe.' }, { status: 403 })
    }

    // Check if Square customer already exists for this user
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('square_customer_id, square_subscription_id')
      .eq('user_id', userId)
      .single()

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
        await squareClient.subscriptions.cancel(oldSubId)
      } catch (cancelErr) {
        console.error('Plan change: could not cancel old subscription', oldSubId, cancelErr)
      }
    }

    // Persist to Supabase. Monthly and annual both grant the one firm plan.
    const annual = planKey === 'partner_annual'
    await supabase.from('subscriptions').upsert({
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
    }, { onConflict: 'user_id' })

    // Save the plan's client seats. Kept as a separate write so checkout still
    // works on a database where migration 010 (client_seats) hasn't run yet;
    // such a firm gets the default seat count until it does.
    const { error: seatsError } = await supabase
      .from('subscriptions')
      .update({ client_seats: seatsForBillingKey(planKey) })
      .eq('user_id', userId)
    if (seatsError) console.error('Could not save client seats for', userId, seatsError.message)

    return NextResponse.json({ success: true, plan: planKey })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Subscription creation failed'
    console.error('Square create-subscription error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
