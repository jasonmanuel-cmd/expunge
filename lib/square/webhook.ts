// Turns a Square webhook event into the update to apply to our subscriptions row.
// Square sends subscription changes (including cancels) as subscription.created /
// subscription.updated, and payments as invoice events that carry subscription_id.

export interface SubscriptionUpdate {
  squareSubscriptionId: string
  fields: Record<string, string | boolean>
}

const STATUS_MAP: Record<string, string> = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  DEACTIVATED: 'canceled',
  PAUSED: 'paused',
  PENDING: 'trialing',
}

interface SquareEvent {
  type?: string
  data?: {
    object?: {
      subscription?: { id?: string; status?: string; charged_through_date?: string }
      invoice?: { subscription_id?: string }
    }
  }
}

export function resolveWebhookUpdate(event: SquareEvent): SubscriptionUpdate | null {
  const obj = event.data?.object

  switch (event.type) {
    case 'subscription.created':
    case 'subscription.updated': {
      const sub = obj?.subscription
      if (!sub?.id) return null
      const status = STATUS_MAP[sub.status ?? 'ACTIVE'] ?? 'active'
      const fields: Record<string, string | boolean> = { status }
      if (status === 'canceled') fields.cancel_at_period_end = true
      // charged_through_date is the day the paid period ends.
      if (sub.charged_through_date) {
        fields.current_period_end = new Date(sub.charged_through_date).toISOString()
      }
      return { squareSubscriptionId: sub.id, fields }
    }

    case 'invoice.scheduled_charge_failed': {
      const subId = obj?.invoice?.subscription_id
      if (!subId) return null
      return { squareSubscriptionId: subId, fields: { status: 'past_due' } }
    }

    case 'invoice.payment_made': {
      const subId = obj?.invoice?.subscription_id
      if (!subId) return null
      // Period end comes with the subscription.updated event Square sends alongside.
      return { squareSubscriptionId: subId, fields: { status: 'active' } }
    }

    default:
      return null
  }
}
