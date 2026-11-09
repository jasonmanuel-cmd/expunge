import { createServiceClient } from '@/lib/supabase/server'
import { holdsSeat, isFirmPlanActive, resolveSeatLimit, seatUsage, type SeatUsage } from './firm'

export interface FirmBranding {
  partnerId: string
  firmName: string
  logoUrl: string | null
}

export interface SponsoringFirm extends FirmBranding {
  /** True when the firm's plan is paid up. */
  active: boolean
  /** True when this client holds one of the firm's client seats. */
  seated: boolean
}

export interface FirmPlanState {
  active: boolean
  seatLimit: number
}

export interface FirmSeats extends SeatUsage {
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

/**
 * A firm's plan state: whether its own subscription is an active firm plan
 * (monthly, annual or invoiced) and how many client seats it includes.
 * Selects every column so a database without the client_seats column yet
 * (migration 010 not run) still works, on the default seat count.
 */
export async function getFirmPlanState(partnerId: string): Promise<FirmPlanState> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', partnerId)
    .maybeSingle()
  return {
    active: isFirmPlanActive(data?.plan, data?.status, {
      periodEnd: data?.current_period_end,
      squareSubscriptionId: data?.square_subscription_id,
    }),
    seatLimit: resolveSeatLimit(data?.client_seats),
  }
}

/** Whether a firm's own subscription is an active firm plan (monthly, annual or invoiced). */
export async function isFirmActive(partnerId: string): Promise<boolean> {
  return (await getFirmPlanState(partnerId)).active
}

/** How many of a firm's client seats are taken. */
export async function getFirmSeats(partnerId: string): Promise<FirmSeats> {
  const supabase = createServiceClient()
  const [state, { count }] = await Promise.all([
    getFirmPlanState(partnerId),
    supabase
      .from('partner_clients')
      .select('consumer_id', { count: 'exact', head: true })
      .eq('partner_id', partnerId),
  ])
  return { active: state.active, ...seatUsage(count ?? 0, state.seatLimit) }
}

/** The firm a client was invited by, if any (earliest link wins). */
export async function getSponsoringFirm(consumerId: string): Promise<SponsoringFirm | null> {
  const supabase = createServiceClient()
  const { data: link } = await supabase
    .from('partner_clients')
    .select('partner_id, created_at')
    .eq('consumer_id', consumerId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (!link) return null

  const [{ data: settings }, state, { count: position }] = await Promise.all([
    supabase
      .from('partner_settings')
      .select('firm_name, logo_url')
      .eq('partner_id', link.partner_id)
      .maybeSingle(),
    getFirmPlanState(link.partner_id),
    // This client's place in the firm's join order (1 = earliest).
    supabase
      .from('partner_clients')
      .select('consumer_id', { count: 'exact', head: true })
      .eq('partner_id', link.partner_id)
      .lte('created_at', link.created_at),
  ])

  return {
    partnerId: link.partner_id,
    firmName: settings?.firm_name ?? 'Your provider',
    logoUrl: settings?.logo_url ?? null,
    active: state.active,
    seated: holdsSeat(position ?? 0, state.seatLimit),
  }
}
