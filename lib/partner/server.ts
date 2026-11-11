import { q1 } from '@/lib/db'
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
  const data = await q1<{ partner_id: string; firm_name: string; logo_url: string | null }>(
    `select partner_id, firm_name, logo_url from partner_settings where invite_code = $1`,
    [code]
  )
  if (!data) return null
  return { partnerId: data.partner_id, firmName: data.firm_name, logoUrl: data.logo_url }
}

/**
 * A firm's plan state: whether its own subscription is an active firm plan
 * (monthly, annual or invoiced) and how many client seats it includes.
 */
export async function getFirmPlanState(partnerId: string): Promise<FirmPlanState> {
  const data = await q1<{
    plan: string
    status: string
    current_period_end: string | null
    square_subscription_id: string | null
    client_seats: number | null
  }>(
    `select plan::text as plan, status::text as status, current_period_end, square_subscription_id, client_seats
       from subscriptions where user_id = $1`,
    [partnerId]
  )
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
  const [state, row] = await Promise.all([
    getFirmPlanState(partnerId),
    q1<{ n: number }>(`select count(*)::int as n from partner_clients where partner_id = $1`, [partnerId]),
  ])
  return { active: state.active, ...seatUsage(row?.n ?? 0, state.seatLimit) }
}

/** The firm a client was invited by, if any (earliest link wins). */
export async function getSponsoringFirm(consumerId: string): Promise<SponsoringFirm | null> {
  const link = await q1<{ id: string; partner_id: string; created_at: string }>(
    `select id, partner_id, created_at from partner_clients
      where consumer_id = $1 order by created_at asc limit 1`,
    [consumerId]
  )
  if (!link) return null

  const [settings, state, pos] = await Promise.all([
    q1<{ firm_name: string; logo_url: string | null }>(
      `select firm_name, logo_url from partner_settings where partner_id = $1`,
      [link.partner_id]
    ),
    getFirmPlanState(link.partner_id),
    // This client's place in the firm's join order (1 = earliest).
    q1<{ n: number }>(
      // Compared in SQL (not via the JS string) to keep microsecond precision.
      `select count(*)::int as n from partner_clients
        where partner_id = $1 and created_at <= (select created_at from partner_clients where id = $2)`,
      [link.partner_id, link.id]
    ),
  ])
  const position = pos?.n ?? 0

  return {
    partnerId: link.partner_id,
    firmName: settings?.firm_name ?? 'Your provider',
    logoUrl: settings?.logo_url ?? null,
    active: state.active,
    seated: holdsSeat(position, state.seatLimit),
  }
}
