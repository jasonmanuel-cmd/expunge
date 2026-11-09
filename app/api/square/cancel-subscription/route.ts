import { NextResponse } from 'next/server'
import { squareClient } from '@/lib/square/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    const { data: sub } = await service
      .from('subscriptions')
      .select('square_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!sub?.square_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    await squareClient.subscriptions.cancel(sub.square_subscription_id)

    // Square stops renewal at the end of the paid period. Access stays until then;
    // the subscription.updated webhook marks it canceled when the period ends.
    await service
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Cancellation failed'
    console.error('Cancel subscription error:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
