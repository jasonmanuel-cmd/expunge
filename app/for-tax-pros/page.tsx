import type { Metadata } from 'next'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'
import { PLANS } from '@/lib/square/client'

export const metadata: Metadata = {
  title: 'Expunge for Tax Firms | Credit dispute help under your firm name',
  description:
    'Give your tax clients a credit report review and dispute letters under your own firm name. One monthly price covers every client you invite.',
}

const SIGNUP = '/register?plan=partner&role=partner'

const STEPS = [
  { title: 'Set up your firm', body: 'Create a firm account, add your firm name and logo, and start the monthly plan.' },
  { title: 'Send your invite link', body: 'Share one link with clients by email or text, or at the end of a tax appointment.' },
  { title: 'Clients upload their report', body: 'Expunge reads their credit report, flags possible errors and drafts dispute letters they mail themselves.' },
  { title: 'Track every client', body: 'Your dashboard shows each client, which items they disputed and what the bureaus said back.' },
]

const WHY = [
  { title: 'A reason to stay in touch', body: 'Clients think about credit year round. This gives you a helpful reason to stay in touch after April.' },
  { title: 'Your brand, not ours', body: 'Clients see your firm name and logo when they join and every time they open their dashboard.' },
  { title: 'No per-client billing', body: 'One flat monthly price. Invite as many clients as you serve; they never see a bill from Expunge.' },
  { title: 'No new staff', body: 'The software does the report review and letter drafting. Your team answers questions and stays the trusted advisor.' },
]

export default function ForTaxProsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-6 sm:px-8 py-4 flex items-center justify-between bg-white">
        <Link href="/">
          <ExpungeLogo variant="primary" width={150} height={38} />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Sign in</Link>
          <Link href={SIGNUP} className="bg-[#F97316] hover:bg-[#EA580C] transition px-4 py-2.5 rounded-lg text-sm font-bold text-white">
            Start your firm plan
          </Link>
        </div>
      </header>

      <main>
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="inline-block text-xs font-semibold bg-[#F97316]/10 text-[#F97316] px-3 py-1 rounded-full mb-5">
            For tax preparers and financial firms
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-5">
            Offer credit dispute help to your clients, under your firm name
          </h1>
          <p className="text-lg text-[#6B7280] max-w-2xl mx-auto mb-8">
            Your clients already trust you with their finances. Expunge lets you add credit report review
            and dispute letters to what you offer, for one flat monthly price.
          </p>
          <Link href={SIGNUP} className="inline-block bg-[#F97316] hover:bg-[#EA580C] transition px-8 py-4 rounded-xl font-bold text-white shadow-lg shadow-orange-200">
            Start your firm plan, {PLANS.partner.priceLabel}
          </Link>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
                <div className="text-[#F97316] font-bold text-sm mb-2">Step {i + 1}</div>
                <div className="font-semibold mb-2">{s.title}</div>
                <div className="text-sm text-[#6B7280]">{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-center mb-10">Why firms add it</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {WHY.map((w) => (
              <div key={w.title} className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
                <div className="font-semibold mb-2">{w.title}</div>
                <div className="text-sm text-[#6B7280]">{w.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-xl mx-auto px-6 pb-16">
          <div className="bg-white border-2 border-[#F97316] rounded-2xl p-8 text-center">
            <div className="text-sm font-semibold text-[#F97316] mb-2">Firm plan</div>
            <div className="text-4xl font-bold mb-1">{PLANS.partner.priceLabel}</div>
            <div className="text-[#6B7280] text-sm mb-6">Cancel any time</div>
            <ul className="text-sm text-left space-y-2 mb-8">
              <li>• Every invited client gets full Pro access</li>
              <li>• Your firm name and logo on client pages</li>
              <li>• One invite link for all your clients</li>
              <li>• Dashboard with each client&apos;s progress</li>
            </ul>
            <Link href={SIGNUP} className="block bg-[#F97316] hover:bg-[#EA580C] transition py-3 rounded-lg font-bold text-white">
              Start your firm plan
            </Link>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-6 text-sm text-[#374151]">
            <div className="font-semibold mb-2">Before you offer credit services</div>
            <p>
              When you offer credit dispute help to your clients, your firm is the credit services provider.
              Federal law (the Credit Repair Organizations Act) and many state laws apply, including rules
              against charging clients before the work is done and, in some states, registration or a bond.
              Expunge is software and does not give legal advice. Talk to an attorney about the rules in your
              state before you offer this to clients.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
