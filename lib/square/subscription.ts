import { q1 } from '@/lib/db'
import { isFirmPlanActive, resolveEffectivePlan } from '@/lib/partner/firm'
import { getSponsoringFirm } from '@/lib/partner/server'

export type PlanTier = 'free' | 'basic' | 'pro' | 'partner'

export interface UserPlan {
  plan: PlanTier
  status: string
  maxCases: number
  maxItems: number
  triBureau: boolean
  escalation: boolean
  partnerDashboard: boolean
  isActive: boolean
  /** True when the user's access is paid for by the firm that invited them. */
  sponsored: boolean
  sponsorFirmName: string | null
  /**
   * True when the client's firm has an active plan but every client seat is
   * taken by clients who joined earlier, so this client can't start reviews.
   */
  seatLimited: boolean
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const sub = await q1<{ plan: string; status: string; current_period_end: string | null; square_subscription_id: string | null }>(
    `select plan::text as plan, status::text as status, current_period_end, square_subscription_id
       from subscriptions where user_id = $1`,
    [userId]
  )

  const ownPlan = (sub?.plan ?? 'free') as PlanTier
  const status = sub?.status ?? 'active'
  // A firm's own plan may be an invoiced license that expires on its period end.
  const ownActive = ownPlan === 'partner'
    ? isFirmPlanActive(ownPlan, status, {
        periodEnd: sub?.current_period_end,
        squareSubscriptionId: sub?.square_subscription_id,
      })
    : status === 'active' || status === 'trialing'

  // Clients invited by a firm with an active firm plan are covered by the firm.
  const firm = ownActive && ownPlan !== 'free' ? null : await getSponsoringFirm(userId)
  const { plan, sponsored } = resolveEffectivePlan({
    ownPlan,
    ownActive,
    // A client is covered only while holding one of the firm's client seats.
    firmActive: (firm?.active ?? false) && (firm?.seated ?? false),
  })
  const isActive = ownActive || sponsored

  const limits = await q1<{
    max_cases: number
    max_items_per_case: number
    tri_bureau: boolean
    escalation_bot: boolean
    partner_dashboard: boolean
  }>(`select * from plan_limits where plan = $1::plan_tier`, [plan])

  // Expunge has no consumer tier. An account with no firm plan behind it (an
  // uninvited sign-up, or a client whose firm's plan lapsed) can sign in and
  // see past work but can't start a new review.
  const covered = plan !== 'free' && isActive

  return {
    plan,
    status,
    maxCases: covered ? limits?.max_cases ?? 0 : 0,
    maxItems: covered ? limits?.max_items_per_case ?? 0 : 0,
    triBureau: covered ? limits?.tri_bureau ?? false : false,
    escalation: covered ? limits?.escalation_bot ?? false : false,
    partnerDashboard: limits?.partner_dashboard ?? false,
    isActive: covered,
    sponsored,
    sponsorFirmName: sponsored ? firm?.firmName ?? null : null,
    seatLimited: !covered && !!firm?.active && !firm.seated,
  }
}

const NOT_COVERED =
  'Your account isn\'t covered by a firm plan right now. Expunge is provided through tax and finance firms: ask the firm that invited you, or use the invite link they sent.'

export const SEAT_LIMITED =
  'Your firm has used all of its client seats on Expunge, so new reviews are paused for your account. Your past letters are still here. Ask your firm to free up a seat or add more.'

export async function assertPlanLimit(
  userId: string,
  check: 'cases' | 'triBureau' | 'escalation' | 'partnerDashboard'
): Promise<{ allowed: boolean; reason?: string; upgradeTo?: PlanTier }> {
  const plan = await getUserPlan(userId)

  if (!plan.isActive && check !== 'partnerDashboard') {
    return { allowed: false, reason: plan.seatLimited ? SEAT_LIMITED : NOT_COVERED }
  }

  if (check === 'cases') {
    const row = await q1<{ n: number }>(
      `select count(*)::int as n from cases where user_id = $1 and status not in ('completed', 'failed')`,
      [userId]
    )

    if ((row?.n ?? 0) >= plan.maxCases) {
      return {
        allowed: false,
        reason: `This account allows ${plan.maxCases} active case${plan.maxCases === 1 ? '' : 's'}. Finish or close one to start another.`,
      }
    }
  }

  if (check === 'triBureau' && !plan.triBureau) {
    return { allowed: false, reason: 'Letters for all 3 bureaus aren\'t included on this account.' }
  }

  if (check === 'escalation' && !plan.escalation) {
    return { allowed: false, reason: 'Escalation help isn\'t included on this account.' }
  }

  if (check === 'partnerDashboard' && !plan.partnerDashboard) {
    return { allowed: false, reason: 'The firm dashboard needs an active firm plan.', upgradeTo: 'partner' }
  }

  return { allowed: true }
}
