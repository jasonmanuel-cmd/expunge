import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({})) as { code?: unknown }
    const code = normalizeInviteCode(body.code)
    if (!code) return NextResponse.json({ error: 'That invite link is not valid.' }, { status: 400 })

    const firm = await getFirmByInviteCode(code)
    if (!firm) return NextResponse.json({ error: 'That invite link is not valid.' }, { status: 404 })

    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'consumer') {
      return NextResponse.json({ error: 'Firm accounts cannot join another firm.' }, { status: 403 })
    }

    // One firm per client: keep an existing link rather than switching firms.
    const { data: existing } = await supabase
      .from('partner_clients')
      .select('partner_id')
      .eq('consumer_id', user.id)
      .limit(1)
      .maybeSingle()

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
      const { error } = await supabase
        .from('partner_clients')
        .insert({ partner_id: firm.partnerId, consumer_id: user.id })
      if (error) throw error
    }

    return NextResponse.json({ linked: true, firmName: firm.firmName })
  } catch (err) {
    console.error('partner join error:', err)
    return NextResponse.json({ error: 'Could not link your account.' }, { status: 500 })
  }
}
