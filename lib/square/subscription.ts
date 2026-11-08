import { createServiceClient } from '@/lib/supabase/server'
import { resolveEffectivePlan } from '@/lib/partner/firm'
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
}

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const supabase = createServiceClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  const ownPlan = (sub?.plan ?? 'free') as PlanTier
  const status = sub?.status ?? 'active'
  const ownActive = status === 'active' || status === 'trialing'

  // Clients invited by a firm with an active Partner plan are covered by the firm.
  const firm = ownActive && ownPlan !== 'free' ? null : await getSponsoringFirm(userId)
  const { plan, sponsored } = resolveEffectivePlan({
    ownPlan,
    ownActive,
    firmActive: firm?.active ?? false,
  })
  const isActive = ownActive || sponsored

  const { data: limits } = await supabase
    .from('plan_limits')
    .select('*')
    .eq('plan', plan)
    .single()

  return {
    plan,
    status,
    maxCases: limits?.max_cases ?? 1,
    maxItems: limits?.max_items_per_case ?? 3,
    triBureau: limits?.tri_bureau ?? false,
    escalation: limits?.escalation_bot ?? false,
    partnerDashboard: limits?.partner_dashboard ?? false,
    isActive,
    sponsored,
    sponsorFirmName: sponsored ? firm?.firmName ?? null : null,
  }
}

export async function assertPlanLimit(
  userId: string,
  check: 'cases' | 'triBureau' | 'escalation' | 'partnerDashboard'
): Promise<{ allowed: boolean; reason?: string; upgradeTo?: PlanTier }> {
  const plan = await getUserPlan(userId)

  if (check === 'cases') {
    const supabase = createServiceClient()
    const { count } = await supabase
      .from('cases')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('status', 'in', '(completed,failed)')

    if ((count ?? 0) >= plan.maxCases) {
      return {
        allowed: false,
        reason: `Your ${plan.plan} plan allows ${plan.maxCases} active case${plan.maxCases === 1 ? '' : 's'}.`,
        upgradeTo: plan.plan === 'free' ? 'basic' : plan.plan === 'basic' ? 'pro' : undefined,
      }
    }
  }

  if (check === 'triBureau' && !plan.triBureau) {
    return { allowed: false, reason: 'Letters for all 3 bureaus need a paid plan.', upgradeTo: 'pro' }
  }

  if (check === 'escalation' && !plan.escalation) {
    return { allowed: false, reason: 'Escalation Bot requires Pro or Partner.', upgradeTo: 'pro' }
  }

  if (check === 'partnerDashboard' && !plan.partnerDashboard) {
    return { allowed: false, reason: 'Partner dashboard requires a Partner plan.', upgradeTo: 'partner' }
  }

  return { allowed: true }
}
