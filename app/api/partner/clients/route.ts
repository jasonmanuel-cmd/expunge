import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { q } from '@/lib/db'
import { isUuid } from '@/lib/ids'

/**
 * DELETE /api/partner/clients
 * Body: { consumerId: string }
 * A firm removes one of its clients, freeing a client seat. The client keeps
 * their account and past letters but is no longer covered by this firm.
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { consumerId?: unknown }
    const consumerId = isUuid(body.consumerId) ? body.consumerId : null
    if (!consumerId) return NextResponse.json({ error: 'Pick a client to remove.' }, { status: 400 })

    if (user.role !== 'partner') {
      return NextResponse.json({ error: 'Only firm accounts can remove clients.' }, { status: 403 })
    }

    // Only this firm's own link is removed, never another firm's.
    const removed = await q(
      `delete from partner_clients where partner_id = $1 and consumer_id = $2 returning consumer_id`,
      [user.id, consumerId]
    )
    if (removed.length === 0) {
      return NextResponse.json({ error: 'That client isn\'t linked to your firm.' }, { status: 404 })
    }

    return NextResponse.json({ removed: true })
  } catch (err) {
    console.error('partner remove client error:', err)
    return NextResponse.json({ error: 'Could not remove this client.' }, { status: 500 })
  }
}
