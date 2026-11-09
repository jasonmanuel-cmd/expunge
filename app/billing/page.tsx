import { BRAND } from '@/lib/brand'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FIRM_MONTHLY, FIRM_ANNUAL, FIRM_CUSTOM, PLAN_DISPLAY_NAMES } from '@/lib/pricing'
import { isFirmPlanActive } from '@/lib/partner/firm'
import { getSponsoringFirm } from '@/lib/partner/server'
import ExpungeLogo from '@/components/ExpungeLogo'
import CancelButton from './cancel-button'

const CHECK = (
  <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const STATUS_COLORS: Record<string, string> = {
  active: 'text-[#16A34A]',
  trialing: 'text-[#F97316]',
  past_due: 'text-[#F97316]',
  canceled: 'text-[#6B7280]',
  paused: 'text-yellow-400',
}

/**
 * Billing. Only firms pay Expunge. A firm sees its plan and the firm offers;
 * a client sees who covers their access. Accounts left on a retired consumer
 * plan (Basic/Pro) can only cancel it.
 */
export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
  ])

  const isFirm = profile?.role === 'partner' || profile?.role === 'admin'
  const plan: string = sub?.plan ?? 'free'
  const status: string = sub?.status ?? 'active'
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const hasSquareSub = Boolean(sub?.square_subscription_id)
  const isRetiredConsumerPlan = plan === 'basic' || plan === 'pro'
  const firmActive = isFirmPlanActive(plan, status, {
    periodEnd: sub?.current_period_end,
    squareSubscriptionId: sub?.square_subscription_id,
  })
  const firm = isFirm ? null : await getSponsoringFirm(user.id)
  const canCancel = hasSquareSub && status === 'active' && plan !== 'free' && !sub?.cancel_at_period_end

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
        <Link href={isFirm ? '/partner/dashboard' : '/dashboard'} className="text-sm text-[#6B7280] hover:text-[#111827] transition">&larr; Dashboard</Link>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-bold mb-2">Billing</h1>
        <p className="text-[#6B7280] text-sm mb-8">
          {isFirm ? 'Your firm’s Expunge plan.' : 'Expunge is provided through firms. Clients are never billed by Expunge.'}
        </p>

        {/* Current plan summary */}
        {(isFirm || isRetiredConsumerPlan) && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Current plan</div>
                <div className="text-2xl font-bold">{PLAN_DISPLAY_NAMES[plan] ?? plan}</div>
                {isFirm && plan === 'partner' && !hasSquareSub && (
                  <div className="text-[#6B7280] text-sm mt-0.5">Licensed by invoice</div>
                )}
              </div>
              <span className={`text-sm font-medium capitalize ${STATUS_COLORS[status] ?? 'text-[#6B7280]'}`}>
                {plan === 'partner' && !firmActive ? 'expired' : status.replace('_', ' ')}
              </span>
            </div>

            {periodEnd && status === 'active' && plan !== 'free' && (
              <div className="text-sm text-[#6B7280] mb-4">
                {sub?.cancel_at_period_end || !hasSquareSub ? `Access ends on ${periodEnd}` : `Renews on ${periodEnd}`}
              </div>
            )}

            {isRetiredConsumerPlan && (
              <p className="text-sm text-[#6B7280]">
                Personal plans are no longer offered. Your access continues until this plan ends or you cancel it.
              </p>
            )}

            {canCancel && (
              <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                <CancelButton />
              </div>
            )}
          </div>
        )}

        {/* Client view */}
        {!isFirm && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 mb-8 text-sm text-[#374151]">
            {firm?.active ? (
              <>Your access is covered by <span className="font-semibold">{firm.firmName}</span>. There is nothing to pay.</>
            ) : firm ? (
              <>{firm.firmName}&apos;s Expunge plan isn&apos;t active right now. Ask them about it; access can&apos;t be bought directly.</>
            ) : (
              <>Your account isn&apos;t linked to a firm. Expunge is only available through tax and finance firms, so ask your firm for their invite link.</>
            )}
          </div>
        )}

        {/* Firm offers */}
        {isFirm && !firmActive && (
          <>
            <h2 className="text-lg font-semibold mb-4">Firm plans</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[FIRM_MONTHLY, FIRM_ANNUAL, FIRM_CUSTOM].map((p) => (
                <div key={p.key} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 flex flex-col">
                  <div className="text-sm font-medium text-[#6B7280] mb-1">{p.name}</div>
                  <div className="text-3xl font-extrabold text-[#111827]">{p.priceLabel}</div>
                  <div className="text-[#6B7280] text-xs mt-1 mb-5">{p.billedAs}</div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-[#374151]">
                        {CHECK}
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.key === 'custom' ? '/demo?interest=license' : `/checkout?plan=${p.key}`}
                    className="w-full text-center py-2.5 rounded-xl text-sm font-bold transition block bg-[#F97316] hover:bg-[#EA580C] text-white"
                  >
                    {p.key === 'custom' ? 'Request a quote' : `Choose ${p.name}`}
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-xs text-[#6B7280] text-center">
          Questions? Contact us at <span className="text-slate-500">{BRAND.supportEmail}</span>
        </div>
      </div>
    </div>
  )
}
