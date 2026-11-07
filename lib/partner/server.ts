import { createServiceClient } from '@/lib/supabase/server'
import { isFirmPlanActive } from './firm'

export interface FirmBranding {
  partnerId: string
  firmName: string
  logoUrl: string | null
}

export interface SponsoringFirm extends FirmBranding {
  /** True when the firm's Partner plan is paid up, so the client is covered. */
  active: boolean
}

/** Looks up a firm by its invite code (for the public join page). */
export async function getFirmByInviteCode(code: string): Promise<FirmBranding | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('partner_settings')
    .select('partner_id, firm_name, logo_url')
    .eq('invite_code', code)
    .maybeSingle()
  if (!data) return null
  return { partnerId: data.partner_id, firmName: data.firm_name, logoUrl: data.logo_url }
}

/** Whether a firm's own subscription is an active Partner plan. */
export async function isFirmActive(partnerId: string): Promise<boolean> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', partnerId)
    .maybeSingle()
  return isFirmPlanActive(data?.plan, data?.status)
}

/** The firm a client was invited by, if any (earliest link wins). */
export async function getSponsoringFirm(consumerId: string): Promise<SponsoringFirm | null> {
  const supabase = createServiceClient()
  const { data: link } = await supabase
    .from('partner_clients')
    .select('partner_id')
    .eq('consumer_id', consumerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!link) return null

  const { data: settings } = await supabase
    .from('partner_settings')
    .select('firm_name, logo_url')
    .eq('partner_id', link.partner_id)
    .maybeSingle()

  return {
    partnerId: link.partner_id,
    firmName: settings?.firm_name ?? 'Your provider',
    logoUrl: settings?.logo_url ?? null,
    active: await isFirmActive(link.partner_id),
  }
}
