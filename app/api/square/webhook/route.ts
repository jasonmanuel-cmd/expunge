import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { resolveWebhookUpdate } from '@/lib/square/webhook'

// Square sends webhook events — we verify signature then update subscription state
export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-square-hmacsha256-signature') ?? ''
    const sigKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY
    if (!sigKey) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY is not set')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/square/webhook`

    // Verify Square HMAC-SHA256 signature (Square docs: HMAC of url+body, base64 encoded)
    const expected = createHmac('sha256', sigKey).update(url + body).digest('base64')
    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)
    const isValid = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const update = resolveWebhookUpdate(event)
    if (!update) return NextResponse.json({ received: true })

    const supabase = createServiceClient()
    const { error } = await supabase
      .from('subscriptions')
      .update(update.fields)
      .eq('square_subscription_id', update.squareSubscriptionId)
    // A non-2xx reply makes Square retry the event later.
    if (error) throw error

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Square webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
