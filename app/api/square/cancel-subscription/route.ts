import { NextResponse } from 'next/server'
import { squareClient } from '@/lib/square/client'
import { getSessionUser } from '@/lib/auth'
import { q1, update } from '@/lib/db'

export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sub = await q1<{ square_subscription_id: string | null }>(
      `select square_subscription_id from subscriptions where user_id = $1`,
      [user.id]
    )

    if (!sub?.square_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    await squareClient.subscriptions.cancel({ subscriptionId: sub.square_subscription_id })

    // Square stops renewal at the end of the paid period. Access stays until then;
    // the subscription.updated webhook marks it canceled when the period ends.
    await update('subscriptions', { cancel_at_period_end: true }, { user_id: user.id })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cancellation failed'
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
