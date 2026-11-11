import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { q1 } from '@/lib/db'
import { generateInviteCode, normalizeFirmName, normalizeLogoUrl } from '@/lib/partner/firm'

/**
 * POST /api/partner/settings
 * Body: { firmName: string, logoUrl?: string }
 * Saves a firm's name and logo. Creates its private invite code the first time.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (user.role !== 'partner') {
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

    // The invite code is made once and never changes on later saves.
    const saved = await q1<{ firm_name: string; logo_url: string | null; invite_code: string }>(
      `insert into partner_settings (partner_id, firm_name, logo_url, invite_code)
       values ($1, $2, $3, $4)
       on conflict (partner_id) do update
         set firm_name = excluded.firm_name, logo_url = excluded.logo_url
       returning firm_name, logo_url, invite_code`,
      [user.id, firmName, logoUrl || null, generateInviteCode()]
    )
    if (!saved) throw new Error('Save failed')

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
