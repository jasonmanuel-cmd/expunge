import { describe, it, expect } from 'vitest'
import { resolveWebhookUpdate } from '@/lib/square/webhook'

describe('resolveWebhookUpdate', () => {
  it('maps subscription.updated ACTIVE with period end', () => {
    const u = resolveWebhookUpdate({
      type: 'subscription.updated',
      data: { object: { subscription: { id: 'sub1', status: 'ACTIVE', charged_through_date: '2026-12-08' } } },
    })
    expect(u).toEqual({
      squareSubscriptionId: 'sub1',
      fields: { status: 'active', current_period_end: new Date('2026-12-08').toISOString() },
    })
  })

  it('treats a CANCELED subscription.updated as a cancel', () => {
    const u = resolveWebhookUpdate({
      type: 'subscription.updated',
      data: { object: { subscription: { id: 'sub1', status: 'CANCELED' } } },
    })
    expect(u?.fields).toEqual({ status: 'canceled', cancel_at_period_end: true })
  })

  it('marks past_due on invoice.scheduled_charge_failed using subscription_id', () => {
    const u = resolveWebhookUpdate({
      type: 'invoice.scheduled_charge_failed',
      data: { object: { invoice: { subscription_id: 'sub2' } } },
    })
    expect(u).toEqual({ squareSubscriptionId: 'sub2', fields: { status: 'past_due' } })
  })

  it('reactivates on invoice.payment_made', () => {
    const u = resolveWebhookUpdate({
      type: 'invoice.payment_made',
      data: { object: { invoice: { subscription_id: 'sub2' } } },
    })
    expect(u).toEqual({ squareSubscriptionId: 'sub2', fields: { status: 'active' } })
  })

  it('ignores invoices with no subscription and unknown events', () => {
    expect(resolveWebhookUpdate({ type: 'invoice.payment_made', data: { object: { invoice: {} } } })).toBeNull()
    expect(resolveWebhookUpdate({ type: 'invoice.created', data: { object: {} } })).toBeNull()
  })
})
