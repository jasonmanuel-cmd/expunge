import type { Metadata } from 'next'
import Link from 'next/link'
import { Icon, ICONS } from '@/components/marketing/icons'
import SiteNav from '@/components/marketing/SiteNav'
import SiteFooter from '@/components/marketing/SiteFooter'
import FirmPricing from '@/components/marketing/FirmPricing'
import { FIRM_MONTHLY, FIRM_ANNUAL } from '@/lib/pricing'

/*
 * Firm-first (B2B) homepage. Copy rules, keep them when editing:
 * - Never say or imply Expunge or a firm removes, deletes, erases or wipes items.
 * - Never promise score increases, point gains, timelines or "results".
 * - Clients review and mail their own letters. Nobody "disputes for" them.
 * - No testimonials, client counts, revenue claims or result stats until an attorney approves them.
 * - Expunge is sold only to businesses. No consumer plans, prices or checkout anywhere.
 * - Don't pitch credit help as a new revenue line: a firm that charges clients for it may be a
 *   regulated credit services organization. Keep the attorney notice on the page.
 */

export const metadata: Metadata = {
  title: 'Expunge | Credit report review software for tax and finance firms',
  description:
    'Business software for tax preparers and financial firms: a branded credit report review and dispute letters clients mail themselves. Licensed to firms monthly or by flat annual fee.',
}

const DEMO = '/demo'
const FIRM_SIGNUP = '/register?plan=partner&role=partner'

const AUDIENCES = [
  { icon: ICONS.doc, title: 'Tax preparers', body: 'Clients already show you their finances every season. Give them a next step when credit comes up.' },
  { icon: ICONS.chart, title: 'Bookkeepers and CPAs', body: 'Add a client resource that fits next to the advice you already give.' },
  { icon: ICONS.home, title: 'Loan officers and brokers', body: 'Point clients to a clear way to check their reports for errors before they apply.' },
  { icon: ICONS.briefcase, title: 'Financial coaches', body: 'Hand clients a tool that explains their report in plain words.' },
]

const FIRM_STEPS = [
  { n: '01', icon: ICONS.palette, title: 'Set up your firm', body: 'Create a firm account, add your name and logo, and start the monthly plan.' },
  { n: '02', icon: ICONS.link, title: 'Share one invite link', body: 'Send it by email or text, or hand it over at the end of an appointment.' },
  { n: '03', icon: ICONS.search, title: 'Clients review their report', body: 'They upload a report. Expunge flags items that may be inaccurate and drafts letters they mail themselves.' },
  { n: '04', icon: ICONS.chart, title: 'You see where each client stands', body: 'Your dashboard lists every client, what they disputed and what the bureaus said back.' },
]

const PLATFORM = [
  {
    icon: ICONS.palette,
    title: 'Your brand on every screen',
    body: 'Clients see your firm name and logo when they join and every time they sign in. Expunge stays in the background.',
    wide: true,
  },
  { icon: ICONS.link, title: 'One private invite link', body: 'No accounts to create for clients. They join from your link and are tied to your firm.', wide: false },
  { icon: ICONS.users, title: 'Client dashboard', body: 'See each client, their open disputes and recorded bureau replies in one list.', wide: false },
  {
    icon: ICONS.doc,
    title: 'Report review and letter drafting',
    body: 'Expunge reads each report, explains items in plain words, marks accurate items as accurate, and drafts letters for the items a client chooses to dispute.',
    wide: true,
  },
  { icon: ICONS.clock, title: 'Follow-up tracking', body: 'Clients mark letters as mailed and get reminders about when to look for a reply.', wide: false },
  { icon: ICONS.lock, title: 'Encrypted data', body: 'Reports and letters are encrypted in transit and at rest.', wide: false },
  { icon: ICONS.shield, title: 'Clients stay in control', body: 'Expunge never contacts bureaus or creditors. Each client decides what to send and mails it.', wide: false },
]

const CLIENTS = [
  { name: 'Maria G.', status: '2 letters drafted', tone: 'orange' },
  { name: 'Darnell W.', status: 'Mailed · reply window open', tone: 'blue' },
  { name: 'Priya S.', status: 'Report reviewed · no errors flagged', tone: 'green' },
  { name: 'Tom R.', status: 'Bureau replied · recorded', tone: 'green' },
] as const

const FAQ = [
  {
    q: 'Does my firm send disputes for clients?',
    a: 'No. Expunge drafts the letters and instructions. Each client reviews them and mails their own letters. Your firm and Expunge never file anything with the bureaus.',
  },
  {
    q: 'What does it cost my clients?',
    a: `Nothing from Expunge. Expunge is licensed to your firm for ${FIRM_MONTHLY.priceLabel} or ${FIRM_ANNUAL.priceLabel}, and every client you invite gets full access. Expunge never bills or takes payment from consumers.`,
  },
  {
    q: 'Can my firm charge clients for this?',
    a: 'Talk to an attorney first. A business that charges people for help with their credit can fall under the federal Credit Repair Organizations Act and state laws, which limit when fees can be collected and in some states require registration or a bond.',
  },
  {
    q: 'Does Expunge promise results?',
    a: 'No. Only the credit bureaus and the companies that report to them decide what stays on a report. Results vary, and accurate, current information can stay.',
  },
  {
    q: 'How is it licensed?',
    a: 'Monthly with no contract, or one flat annual license paid by card or invoice. Networks and companies that want it under their own brand, or want to own a copy outright, can request a quote.',
  },
  {
    q: 'Can individuals buy Expunge?',
    a: 'No. Expunge is business software sold only to firms. Individuals get access through a firm that invites them, and anyone can dispute errors with the credit bureaus directly, for free.',
  },
]

const toneClass: Record<(typeof CLIENTS)[number]['tone'], string> = {
  orange: 'bg-[#FFF7ED] text-[#C2410C] ring-[#FED7AA]',
  blue: 'bg-[#EFF6FF] text-[#1D4ED8] ring-[#BFDBFE]',
  green: 'bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]',
}

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${dark ? 'text-[#FB923C]' : 'text-[#F97316]'}`}>{children}</p>
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col text-[#0D1B2E]">
      <SiteNav />

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1426] pt-36 pb-24 sm:pt-44 sm:pb-32">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-60" />
        <div aria-hidden="true" className="absolute -top-40 left-1/2 -translate-x-1/2 h-[560px] w-[900px] rounded-full bg-[#F97316]/20 blur-[120px]" />
        <div aria-hidden="true" className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-[#1E3A5F]/70 blur-[100px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white/80 mb-7">
                <Icon d={ICONS.building} className="w-4 h-4 text-[#FB923C]" />
                White-label software for tax and finance firms
              </div>

              <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[4.1rem] font-bold tracking-[-0.035em] text-white">
                Give your clients a credit report review{' '}
                <span className="text-gradient-orange">under your firm&apos;s name.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/65 max-w-xl">
                Your clients upload their report, see which items may be inaccurate, and get dispute letters they mail themselves. You get a branded portal and a dashboard for every client, licensed to your firm for a flat monthly or annual fee.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href={DEMO}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] transition-colors px-7 py-4 text-base sm:text-lg font-bold text-white shadow-[0_0_40px_rgba(249,115,22,0.45)]"
                >
                  Book a demo
                  <Icon d={ICONS.arrow} className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={FIRM_SIGNUP}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors px-7 py-4 text-base sm:text-lg font-semibold text-white"
                >
                  Start your firm plan
                </Link>
              </div>
              <p className="mt-4 text-sm text-white/45">{FIRM_MONTHLY.priceLabel} or {FIRM_ANNUAL.priceLabel} · every invited client included · sold to businesses only</p>
            </div>

            {/* Firm dashboard mock */}
            <div className="relative animate-fade-in-up-delay-2">
              <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-[#F97316]/25 via-transparent to-[#4A7FA8]/25 blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="relative overflow-hidden rounded-xl bg-white">
                  <div className="flex items-center justify-between bg-[#0D1B2E] px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[11px] font-bold text-white">YF</div>
                      <div>
                        <div className="text-sm font-semibold text-white leading-tight">Your Firm Name</div>
                        <div className="text-[11px] text-white/45 leading-tight">Client dashboard</div>
                      </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-white/45">Sample</span>
                  </div>

                  <div className="grid grid-cols-3 divide-x divide-black/5 border-b border-black/5">
                    {[
                      { k: 'Clients invited', v: '24' },
                      { k: 'Reports reviewed', v: '17' },
                      { k: 'Letters mailed', v: '9' },
                    ].map((m) => (
                      <div key={m.k} className="px-4 py-3">
                        <div className="text-xl font-bold tabular-nums">{m.v}</div>
                        <div className="text-[11px] text-[#8A847E]">{m.k}</div>
                      </div>
                    ))}
                  </div>

                  <ul className="divide-y divide-black/5">
                    {CLIENTS.map((c) => (
                      <li key={c.name} className="flex items-center justify-between gap-4 px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F6F5F4] text-xs font-semibold text-[#615D59]">
                            {c.name.split(' ').map((p) => p[0]).join('')}
                          </div>
                          <span className="text-sm font-semibold truncate">{c.name}</span>
                        </div>
                        <span className={`shrink-0 text-right text-[11px] sm:text-xs font-medium rounded-lg px-2.5 py-1 ring-1 ${toneClass[c.tone]}`}>{c.status}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between gap-3 border-t border-black/5 bg-[#F6F5F4] px-5 py-3">
                    <span className="text-xs text-[#8A847E]">Invite link: yourfirm · join</span>
                    <span className="text-xs font-semibold text-[#EA580C]">Copy link</span>
                  </div>
                </div>
              </div>

              <div className="float-slow absolute -bottom-6 -left-4 sm:-left-8 hidden sm:flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                  <Icon d={ICONS.users} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold">New client joined from your link</div>
                  <div className="text-[11px] text-[#8A847E]">Shown with your logo, not ours</div>
                </div>
              </div>
            </div>
          </div>

          {/* Value strip */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {[
              { icon: ICONS.palette, top: 'Your brand', sub: 'Name and logo on client pages' },
              { icon: ICONS.users, top: 'Every client included', sub: 'No per-client billing' },
              { icon: ICONS.clock, top: 'No new staff', sub: 'Software does the drafting' },
              { icon: ICONS.shield, top: 'Clients mail it', sub: 'Nobody files for them' },
            ].map((t) => (
              <div key={t.top} className="flex items-center gap-3 bg-[#0B1426] px-4 sm:px-6 py-5">
                <Icon d={t.icon} className="w-5 h-5 shrink-0 text-[#F97316]" />
                <div>
                  <div className="text-sm font-semibold text-white">{t.top}</div>
                  <div className="text-xs text-white/50">{t.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who it's for ────────────────────────────────── */}
      <section className="py-24 sm:py-28 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>Who it&apos;s for</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Built for the people clients already trust with money</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="glow-card relative overflow-hidden rounded-3xl border border-black/[0.07] bg-white p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0D1B2E] text-[#F97316]">
                  <Icon d={a.icon} className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#615D59]">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works for firms ──────────────────────── */}
      <section id="how-it-works" className="py-24 sm:py-32 bg-[#F6F5F4] scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Set it up once. No new staff.</h2>
            <p className="mt-4 text-lg text-[#615D59]">You share the link. The software does the report review and letter drafting. Your team stays the trusted advisor.</p>
          </div>

          <ol className="relative mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div aria-hidden="true" className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-[#F97316]/40 to-transparent" />
            {FIRM_STEPS.map((s) => (
              <li key={s.n} className="relative rounded-3xl border border-black/[0.07] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(13,27,46,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D1B2E] text-[#F97316] shadow-[0_8px_24px_rgba(13,27,46,0.25)]">
                    <Icon d={s.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-4xl font-bold text-black/[0.06] tabular-nums">{s.n}</span>
                </div>
                <h3 className="mt-6 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#615D59]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Platform (bento) ────────────────────────────── */}
      <section id="platform" className="py-24 sm:py-32 bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <Eyebrow>Platform</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Everything a firm needs to offer it</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLATFORM.map((f) => (
              <div key={f.title} className={`glow-card relative overflow-hidden rounded-3xl border border-black/[0.07] bg-white p-7 ${f.wide ? 'md:col-span-2' : ''}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                  <Icon d={f.icon} className="w-5 h-5" />
                </div>
                <h3 className="mt-5 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 leading-relaxed text-[#615D59] max-w-lg">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What clients see (dark band) ────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1426] py-24 sm:py-28">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-40" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 h-[420px] w-[620px] rounded-full bg-[#F97316]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Eyebrow dark>What your clients see</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">An honest look at their report</h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              Expunge flags what may be wrong and says so plainly when an item looks accurate. Clients learn they can dispute errors with the bureaus for free, and get letters that make it easier.
            </p>
            <Link href={DEMO} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#FB923C] hover:text-[#FDBA74] transition-colors">
              See the client experience in a demo
              <Icon d={ICONS.arrow} className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl">
            <div className="relative overflow-hidden rounded-xl bg-white">
              <div aria-hidden="true" className="scan-line pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F97316]/0 via-[#F97316]/15 to-[#F97316]/0" />
              <div className="flex items-center justify-between bg-[#0D1B2E] px-5 py-3">
                <span className="text-sm font-semibold text-white">Report review</span>
                <span className="text-[11px] text-white/45">Powered by Your Firm Name</span>
              </div>
              <ul className="divide-y divide-black/5">
                {[
                  { n: 'ABC COLLECTIONS', f: 'Balance doesn’t match your records', flag: true },
                  { n: 'UNKNOWN AUTO LLC', f: 'You don’t recognize this account', flag: true },
                  { n: 'CAPITAL ONE', f: 'Looks accurate · no dispute suggested', flag: false },
                ].map((r) => (
                  <li key={r.n} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <span className="text-sm font-semibold truncate">{r.n}</span>
                    <span className={`shrink-0 max-w-[60%] text-right text-[11px] sm:text-xs font-medium rounded-lg px-2.5 py-1 ring-1 ${r.flag ? 'bg-[#FFF7ED] text-[#C2410C] ring-[#FED7AA]' : 'bg-[#F0FDF4] text-[#15803D] ring-[#BBF7D0]'}`}>{r.f}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-black/5 bg-[#F6F5F4] px-5 py-3 text-xs text-[#8A847E]">2 draft letters ready for the client to review and mail</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="py-24 sm:py-32 bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">License it monthly or for a flat yearly fee</h2>
            <p className="mt-4 text-lg text-[#615D59]">No per-client fees. Every client you invite is included.</p>
          </div>

          <div className="mt-16">
            <FirmPricing />
          </div>

          <p className="mt-8 text-center text-sm text-[#8A847E]">
            Expunge is sold to businesses only. There are no consumer plans and clients never pay Expunge.
          </p>
        </div>
      </section>

      {/* ── Compliance notice for firms ─────────────────── */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-5 rounded-3xl border border-[#FED7AA] bg-[#FFF7ED] p-7">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#F97316]">
              <Icon d={ICONS.scale} className="w-5 h-5" />
            </div>
            <div className="text-sm leading-relaxed text-[#374151]">
              <div className="text-base font-semibold text-[#0D1B2E]">Before you offer credit services</div>
              <p className="mt-2">
                When your firm offers credit dispute help to clients, your firm may be the credit services provider. The federal Credit Repair Organizations Act and many state laws can apply, including rules against charging clients before the work is done and, in some states, registration or a bond. Expunge sells software to your firm, does not provide credit repair or any credit services to consumers, and does not give legal advice. Your firm is responsible for its own compliance. Talk to an attorney about the rules in your state before you offer this to clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="py-24 sm:py-28 bg-[#F6F5F4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-center">Questions firms ask</h2>
          <div className="mt-12 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-black/[0.07] bg-white px-6 py-5 open:shadow-[0_12px_32px_rgba(13,27,46,0.06)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6F5F4] text-[#F97316] transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-[#615D59]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1426] py-24 sm:py-32">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-50" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[780px] rounded-full bg-[#F97316]/20 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">See it with your firm&apos;s name on it</h2>
          <p className="mt-5 text-lg text-white/65">A short walkthrough of the client portal, the firm dashboard and how clients join from your link.</p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
            <Link href={DEMO} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] transition-colors px-9 py-4 text-lg font-bold text-white shadow-[0_0_48px_rgba(249,115,22,0.5)]">
              Book a demo
              <Icon d={ICONS.arrow} className="w-5 h-5" />
            </Link>
            <Link href={FIRM_SIGNUP} className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors px-9 py-4 text-lg font-semibold text-white">
              Start your firm plan
            </Link>
          </div>
          <p className="mt-5 text-sm text-white/40">Clients mail every dispute themselves · Results vary</p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
