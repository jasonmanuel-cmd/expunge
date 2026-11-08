import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { generateInviteCode, normalizeFirmName, normalizeLogoUrl } from '@/lib/partner/firm'

/**
 * POST /api/partner/settings
 * Body: { firmName: string, logoUrl?: string }
 * Saves a firm's name and logo. Creates its private invite code the first time.
 */
export async function POST(req: NextRequest) {
  try {
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const supabase = createServiceClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'partner') {
      return NextResponse.json({ error: 'Only firm accounts can do this.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({})) as { firmName?: unknown; logoUrl?: unknown }
    const firmName = normalizeFirmName(body.firmName)
    if (!firmName) {
      return NextResponse.json({ error: 'Firm name must be 2 to 120 characters.' }, { status: 400 })
    }
    const logoUrl = normalizeLogoUrl(body.logoUrl)
    if (logoUrl === null) {
      return NextResponse.json({ error: 'Logo must be an https:// image link, or left blank.' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('partner_settings')
      .select('invite_code')
      .eq('partner_id', user.id)
      .maybeSingle()

    const { data: saved, error } = await supabase
      .from('partner_settings')
      .upsert({
        partner_id: user.id,
        firm_name: firmName,
        logo_url: logoUrl || null,
        invite_code: existing?.invite_code ?? generateInviteCode(),
      }, { onConflict: 'partner_id' })
      .select('firm_name, logo_url, invite_code')
      .single()

    if (error || !saved) throw error ?? new Error('Save failed')

    return NextResponse.json({
      firmName: saved.firm_name,
      logoUrl: saved.logo_url,
      inviteCode: saved.invite_code,
    })
  } catch (err) {
    console.error('partner settings error:', err)
    return NextResponse.json({ error: 'Could not save firm settings.' }, { status: 500 })
  }
}
