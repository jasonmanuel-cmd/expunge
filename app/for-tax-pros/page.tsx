import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/marketing/SiteNav'
import SiteFooter from '@/components/marketing/SiteFooter'
import { Icon, ICONS } from '@/components/marketing/icons'
import FirmPricing from '@/components/marketing/FirmPricing'
import { FIRM_MONTHLY } from '@/lib/pricing'

export const metadata: Metadata = {
  title: 'Expunge for Tax Firms | Credit dispute help under your firm name',
  description:
    'Business software for tax firms: give clients a credit report review and dispute letters under your own firm name. Licensed monthly or by flat annual fee.',
}

const SIGNUP = '/register?plan=partner&role=partner'

const STEPS = [
  { icon: ICONS.palette, title: 'Set up your firm', body: 'Create a firm account, add your firm name and logo, and choose monthly or the annual license.' },
  { icon: ICONS.link, title: 'Send your invite link', body: 'Share one link with clients by email or text, or at the end of a tax appointment.' },
  { icon: ICONS.search, title: 'Clients upload their report', body: 'Expunge reads their credit report, flags possible errors and drafts dispute letters they mail themselves.' },
  { icon: ICONS.chart, title: 'Track every client', body: 'Your dashboard shows each client, which items they disputed and what the bureaus said back.' },
]

const WHY = [
  { icon: ICONS.calendar, title: 'A reason to stay in touch', body: 'Clients think about credit year round. This gives you a helpful reason to stay in touch after April.' },
  { icon: ICONS.palette, title: 'Your brand, not ours', body: 'Clients see your firm name and logo when they join and every time they open their dashboard.' },
  { icon: ICONS.users, title: 'No per-client billing', body: 'One flat monthly or annual fee. Invite as many clients as you serve; Expunge never bills them.' },
  { icon: ICONS.clock, title: 'No new staff', body: 'The software does the report review and letter drafting. Your team answers questions and stays the trusted advisor.' },
]

const SEASON = [
  { t: 'At the appointment', b: 'When a client mentions a denied loan or a confusing report, hand them your invite link.' },
  { t: 'In your follow-up email', b: 'Add the link to your post-season thank-you so clients have a next step.' },
  { t: 'Between seasons', b: 'Clients who joined keep using your branded portal, so your name stays in front of them.' },
]

export default function ForTaxProsPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col text-[#0D1B2E]">
      <SiteNav />

      <section className="relative overflow-hidden bg-[#0B1426] pt-36 pb-24 sm:pt-44 sm:pb-28">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-60" />
        <div aria-hidden="true" className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[860px] rounded-full bg-[#F97316]/20 blur-[120px]" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white/80 mb-7">
            <Icon d={ICONS.doc} className="w-4 h-4 text-[#FB923C]" />
            For tax preparers and financial firms
          </div>
          <h1 className="text-[2.4rem] leading-[1.05] sm:text-6xl font-bold tracking-[-0.035em] text-white">
            Offer credit dispute help to your clients,{' '}
            <span className="text-gradient-orange">under your firm name</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/65 max-w-2xl mx-auto">
            Your clients already trust you with their finances. Expunge lets you add credit report review and dispute letters to what you offer, for one flat monthly price.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link href={SIGNUP} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] transition-colors px-7 py-4 text-base sm:text-lg font-bold text-white shadow-[0_0_40px_rgba(249,115,22,0.45)]">
              Start your firm plan, {FIRM_MONTHLY.priceLabel}
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors px-7 py-4 text-base sm:text-lg font-semibold text-white">
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-center">How it works</h2>
          <ol className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-3xl border border-black/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(13,27,46,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0D1B2E] text-[#F97316]">
                    <Icon d={s.icon} className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-[#F97316]">Step {i + 1}</span>
                </div>
                <div className="mt-5 font-bold">{s.title}</div>
                <div className="mt-2 text-sm leading-relaxed text-[#615D59]">{s.body}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-24 bg-[#F6F5F4]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-center">Why firms add it</h2>
          <div className="mt-12 grid sm:grid-cols-2 gap-5">
            {WHY.map((w) => (
              <div key={w.title} className="glow-card relative overflow-hidden flex gap-4 rounded-3xl border border-black/[0.07] bg-white p-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                  <Icon d={w.icon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold">{w.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-[#615D59]">{w.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0B1426] py-24">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-40" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-white text-center">Where it fits in your season</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-5">
            {SEASON.map((s) => (
              <div key={s.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur">
                <div className="font-semibold text-white">{s.t}</div>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-[#0D1B2E]">Firm licensing</h2>
          <p className="mt-3 mb-12 text-center text-[#615D59]">Sold to businesses only. Your clients never pay Expunge.</p>
          <FirmPricing />
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-5 rounded-3xl border border-[#FED7AA] bg-[#FFF7ED] p-7 text-sm leading-relaxed text-[#374151]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#F97316]">
              <Icon d={ICONS.scale} className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-[#0D1B2E]">Before you offer credit services</div>
              <p className="mt-2">
                When you offer credit dispute help to your clients, your firm is the credit services provider.
                Federal law (the Credit Repair Organizations Act) and many state laws apply, including rules
                against charging clients before the work is done and, in some states, registration or a bond.
                Expunge sells software to your firm, does not provide credit services to consumers and does not
                give legal advice. Your firm is responsible for its own compliance. Talk to an attorney about the
                rules in your state before you offer this to clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
