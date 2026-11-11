import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { q, q1 } from '@/lib/db'
import { normalizeInviteCode } from '@/lib/partner/firm'
import { getFirmByInviteCode, getFirmSeats } from '@/lib/partner/server'

/**
 * POST /api/partner/join
 * Body: { code: string }
 * Links the signed-in client to the firm that owns the invite code.
 * (New signups are linked automatically by the signup trigger; this covers
 * people who already had an account.) Refused when the firm has no open
 * client seat.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { code?: unknown }
    const code = normalizeInviteCode(body.code)
    if (!code) return NextResponse.json({ error: 'That invite link is not valid.' }, { status: 400 })

    const firm = await getFirmByInviteCode(code)
    if (!firm) return NextResponse.json({ error: 'That invite link is not valid.' }, { status: 404 })

    if (user.role !== 'consumer') {
      return NextResponse.json({ error: 'Firm accounts cannot join another firm.' }, { status: 403 })
    }

    // One firm per client: keep an existing link rather than switching firms.
    const existing = await q1<{ partner_id: string }>(
      `select partner_id from partner_clients where consumer_id = $1 limit 1`,
      [user.id]
    )

    if (existing && existing.partner_id !== firm.partnerId) {
      return NextResponse.json({ error: 'Your account is already linked to another firm.' }, { status: 409 })
    }

    if (!existing) {
      // Each linked client takes one of the firm's client seats.
      const seats = await getFirmSeats(firm.partnerId)
      if (seats.full) {
        return NextResponse.json(
          { error: `${firm.firmName} has no open client seats right now. Ask them to free one up or add more, then open this link again.`, code: 'SEATS_FULL' },
          { status: 409 }
        )
      }
      await q(
        `insert into partner_clients (partner_id, consumer_id) values ($1, $2) on conflict do nothing`,
        [firm.partnerId, user.id]
      )
    }

    return NextResponse.json({ linked: true, firmName: firm.firmName })
  } catch (err) {
    console.error('partner join error:', err)
    return NextResponse.json({ error: 'Could not link your account.' }, { status: 500 })
  }
}
