import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PLANS } from '@/lib/square/client'
import ExpungeLogo from '@/components/ExpungeLogo'
import CancelButton from './cancel-button'

const CHECK = (
  <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const UPGRADE_CTA: Record<string, { label: string; href: string }> = {
  free: { label: 'Upgrade to Pro', href: '/checkout?plan=pro' },
  basic: { label: 'Upgrade to Pro', href: '/checkout?plan=pro' },
  pro: { label: 'Upgrade to Partner', href: '/checkout?plan=partner' },
  partner: { label: 'Contact Sales', href: '/pricing' },
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const plan = (sub?.plan ?? 'free') as keyof typeof PLANS
  const status = sub?.status ?? 'active'
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  const STATUS_COLORS: Record<string, string> = {
    active: 'text-[#16A34A]',
    trialing: 'text-[#F97316]',
    past_due: 'text-[#F97316]',
    canceled: 'text-[#6B7280]',
    paused: 'text-yellow-400',
  }

  const planKeys = Object.keys(PLANS) as (keyof typeof PLANS)[]

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
        <Link href="/dashboard" className="text-sm text-[#6B7280] hover:text-[#111827] transition">&larr; Dashboard</Link>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <h1 className="text-2xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-[#6B7280] text-sm mb-8">Manage your plan and payment. Upgrade any time for instant access.</p>

        {/* Current plan summary */}
        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1">Current Plan</div>
              <div className="text-2xl font-bold">{PLANS[plan].name}</div>
              <div className="text-[#6B7280] text-sm mt-0.5">{PLANS[plan].priceLabel}</div>
            </div>
            <span className={`text-sm font-medium capitalize ${STATUS_COLORS[status] ?? 'text-[#6B7280]'}`}>
              {status.replace('_', ' ')}
            </span>
          </div>

          {periodEnd && status === 'active' && (
            <div className="text-sm text-[#6B7280] mb-4">
              {sub?.cancel_at_period_end ? `Cancels on ${periodEnd}` : `Renews on ${periodEnd}`}
            </div>
          )}

          {/* Quick actions row */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-[#E5E7EB]">
            <Link
              href={UPGRADE_CTA[plan].href}
              className="flex-1 min-w-[180px] text-center bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-3 rounded-xl transition text-sm"
            >
              {UPGRADE_CTA[plan].label}
            </Link>
            <Link
              href="/pricing"
              className="flex-1 min-w-[180px] text-center border border-[#D1D5DB] hover:border-[#9CA3AF] text-[#374151] bg-white hover:bg-[#F9FAFB] font-medium py-3 rounded-xl transition text-sm"
            >
              View all plans
            </Link>
          </div>

          {status === 'active' && plan !== 'free' && !sub?.cancel_at_period_end && (
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              <CancelButton />
            </div>
          )}
        </div>

        {/* Plan comparison grid */}
        <h2 className="text-lg font-semibold mb-4">All plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {planKeys.map((key) => {
            const p = PLANS[key]
            const isCurrent = plan === key
            const isHighlighted = p.highlighted

            return (
              <div
                key={key}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all ${
                  isCurrent
                    ? 'border-[#F97316] ring-2 ring-[#F97316]/20 bg-white'
                    : isHighlighted
                      ? 'border-[#F97316] shadow-xl shadow-orange-100 bg-white'
                      : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-5">
                  <div className="text-sm font-medium text-[#6B7280] mb-1">{p.name}</div>
                  <div className="text-3xl font-extrabold text-[#111827]">{p.priceLabel}</div>
                  <div className="text-[#6B7280] text-xs mt-1">{p.description}</div>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-[#374151]">
                      {CHECK}
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm font-medium border border-[#E5E7EB] text-[#6B7280]">
                    Current plan
                  </div>
                ) : (
                  <Link
                    href={`/checkout?plan=${key}`}
                    className={`w-full text-center py-2.5 rounded-xl text-sm font-bold transition block ${
                      isHighlighted
                        ? 'bg-[#F97316] hover:bg-[#EA580C] text-white'
                        : 'border-2 border-[#E5E7EB] hover:border-[#D1D5DB] bg-white text-[#374151] hover:bg-[#F5F5F7]'
                    }`}
                  >
                    {key === 'free' ? 'Select' : `Upgrade to ${p.name}`}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        <div className="text-xs text-[#6B7280] text-center">
          Questions? Contact us at <span className="text-slate-500">support@expunge.ai</span>
        </div>
      </div>
    </div>
  )
}
