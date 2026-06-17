import Link from 'next/link'
import { PLANS } from '@/lib/square/client'
import { createClient } from '@/lib/supabase/server'
import ExpungeLogo from '@/components/ExpungeLogo'

const CHECK = (
  <svg className="w-5 h-5 text-[#27AE60] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
)

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let currentPlan = 'free'
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', user.id)
      .single()
    currentPlan = sub?.plan ?? 'free'
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <ExpungeLogo variant="primary" width={160} height={40} />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard" className="text-sm text-[#6B7280] hover:text-[#111827] transition font-medium">Dashboard</Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-[#6B7280] hover:text-[#111827] transition font-medium">Sign in</Link>
                <Link href="/register" className="text-sm bg-[#F97316] hover:bg-[#EA580C] transition px-5 py-2.5 rounded-lg font-semibold text-white">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-[#FFF7ED] border border-[#FED7AA] rounded-full px-4 py-1.5 text-sm text-[#F97316] font-medium mb-6">
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 text-[#111827]">Simple, transparent pricing</h1>
          <p className="text-[#6B7280] text-xl max-w-2xl mx-auto">
            Start free. Upgrade when you want the full playbook.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {(Object.entries(PLANS) as [string, typeof PLANS[keyof typeof PLANS]][]).map(([key, plan]) => {
            const isCurrent = currentPlan === key
            const isHighlighted = plan.highlighted

            return (
              <div
                key={key}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  isHighlighted
                    ? 'bg-white border-[#F97316] shadow-xl shadow-orange-100'
                    : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-sm font-medium text-[#6B7280] mb-1">{plan.name}</div>
                  <div className="text-4xl font-extrabold text-[#111827] mb-1">{plan.priceLabel}</div>
                  <div className="text-[#6B7280] text-sm">{plan.description}</div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#374151]">
                      {CHECK}
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center py-3 rounded-xl text-sm font-medium border border-[#E5E7EB] text-[#6B7280]">
                    Current plan
                  </div>
                ) : (
                  <Link
                    href={user ? '/dashboard' : '/register'}
                    className={`w-full text-center py-3 rounded-xl text-sm font-bold transition block ${
                      isHighlighted
                        ? 'bg-[#E63946] hover:bg-[#c92e3a] text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    {key === 'free' ? plan.cta : `Start free — ${plan.priceLabel}`}
                  </Link>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ strip */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#E5E7EB] pt-16">
          {[
            { q: 'Is this legal advice?', a: 'No. Expunge is software that helps you generate documents and instructions. We are not a law firm and do not provide legal advice. You decide which disputes to send.' },
            { q: 'Will this hurt my credit score?', a: 'No. Filing disputes does not negatively impact your score. The worst outcome is the bureau verifies the item and it stays.' },
            { q: 'What payment methods?', a: 'All major credit and debit cards via Square — Visa, Mastercard, Amex, Discover. Secure, encrypted. Cancel anytime.' },
          ].map(({ q, a }) => (
            <div key={q}>
              <div className="font-semibold mb-2 text-[#111827]">{q}</div>
              <div className="text-[#6B7280] text-sm leading-relaxed">{a}</div>
            </div>
          ))}
        </div>

        {/* Legal footer */}
        <div className="mt-12 text-center text-[#9CA3AF] text-xs">
          By subscribing you agree to our{' '}
          <Link href="/terms" className="text-[#6B7280] hover:text-[#374151] underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-[#6B7280] hover:text-[#374151] underline">Privacy Policy</Link>.
          Expunge is not a law firm and does not provide legal advice.
        </div>
      </div>
    </div>
  )
}
