import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

/*
 * Homepage copy rules (keep these when editing):
 * - Never say or imply Expunge removes, deletes, erases or wipes items.
 * - Never promise a score increase, a number of points, or a timeline.
 * - Only talk about disputing errors or items that may be inaccurate.
 * - Never say "we dispute for you". The user mails their own letters.
 * - Say "results vary" and that anyone can dispute errors with the bureaus for free.
 * - No testimonials, user counts or result stats unless an attorney has approved them.
 */

type IconProps = { className?: string }

function Icon({ d, className = 'w-5 h-5' }: IconProps & { d: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

const ICONS = {
  upload: 'M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5',
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  doc: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  mail: 'M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75',
  clock: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  shield: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  lock: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
  scale: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
  check: 'M4.5 12.75l6 6 9-13.5',
  arrow: 'M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3',
  building: 'M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21',
}

/* Sample report rows for the hero mock. Shows that accurate items stay put. */
const SAMPLE_ITEMS = [
  { name: 'ABC COLLECTIONS', detail: 'Balance reported: $2,340', flag: 'Balance doesn’t match your records', tone: 'flag' as const },
  { name: 'UNKNOWN AUTO LLC', detail: 'Account opened 03/2024', flag: 'You don’t recognize this account', tone: 'flag' as const },
  { name: 'CAPITAL ONE', detail: 'Late payment · 06/2023', flag: 'Looks accurate · no dispute suggested', tone: 'ok' as const },
  { name: 'CHASE FREEDOM', detail: 'Current · paid as agreed', flag: 'No issues found', tone: 'ok' as const },
]

const STEPS = [
  {
    n: '01',
    icon: ICONS.upload,
    title: 'Upload your report',
    body: 'Add the credit report you pulled from Equifax, Experian or TransUnion. Expunge reads every account, inquiry and public record on it.',
  },
  {
    n: '02',
    icon: ICONS.search,
    title: 'See what may be wrong',
    body: 'Expunge flags items that may be inaccurate, incomplete or not yours, and explains each one in plain words. Items that look accurate are marked as accurate.',
  },
  {
    n: '03',
    icon: ICONS.mail,
    title: 'Send your own letters',
    body: 'Pick which items to dispute. Expunge drafts the letters and a checklist. You print, sign and mail them, and Expunge keeps your dates.',
  },
]

const FEATURES = [
  {
    icon: ICONS.doc,
    title: 'Letters that cite your rights',
    body: 'Each letter names the item, says what looks wrong, and points to your dispute rights under the Fair Credit Reporting Act.',
    wide: true,
  },
  {
    icon: ICONS.clock,
    title: 'Your timeline, tracked',
    body: 'Mark a letter as mailed and Expunge reminds you when to look for the bureau’s reply.',
    wide: false,
  },
  {
    icon: ICONS.check,
    title: 'What to attach',
    body: 'A checklist for each letter: ID, proof of address and any records that back up your dispute.',
    wide: false,
  },
  {
    icon: ICONS.scale,
    title: 'Honest about accurate items',
    body: 'If an item is accurate and current, nobody can make the bureaus drop it, and Expunge won’t pretend otherwise. It helps you challenge what’s actually wrong.',
    wide: true,
  },
]

const FAQ = [
  {
    q: 'Can I dispute errors without Expunge?',
    a: 'Yes. You have the right to dispute inaccurate information directly with Equifax, Experian and TransUnion, for free. Expunge makes it easier to find possible errors and write the letters, but you never need to pay anyone to dispute.',
  },
  {
    q: 'Does Expunge remove items from my report?',
    a: 'No. Only the credit bureaus and the companies that report to them decide what stays on your report. Expunge helps you challenge items that may be inaccurate. Results vary, and accurate, current information can stay on your report.',
  },
  {
    q: 'Does Expunge send disputes for me?',
    a: 'No. Expunge drafts the letters and instructions. You decide what to send, then sign and mail every letter yourself.',
  },
  {
    q: 'Will disputing hurt my credit score?',
    a: 'Filing a dispute does not by itself lower your score. The bureau investigates and tells you the result.',
  },
  {
    q: 'Is this legal advice?',
    a: 'No. Expunge is software, not a law firm, and does not give legal advice.',
  },
]

function Check() {
  return (
    <svg className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    per: 'forever',
    blurb: 'Try Expunge with one report.',
    features: ['1 credit report', 'Up to 3 items disputed', 'Letters for 1 bureau', 'AI report review', 'Email support'],
    href: '/register',
    cta: 'Start free',
    style: 'plain' as const,
  },
  {
    key: 'basic',
    name: 'Basic',
    price: '$49.99',
    per: '/mo',
    blurb: 'Dispute a few items.',
    features: ['Up to 5 credit reports, 15 items each', 'A plain-words explanation and your dispute options for each item', 'Dispute letters for all 3 bureaus', 'Step-by-step sending and follow-up instructions', '30-day follow-up tracking', 'Priority support'],
    href: '/register?plan=basic',
    cta: 'Choose Basic',
    style: 'plain' as const,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$99.99',
    per: '/mo',
    blurb: 'Your whole report, reviewed.',
    features: ['Every item on your report reviewed', 'Full breakdown: type, age, what may be wrong, your options', 'Dispute letters for all 3 bureaus for every item you choose', 'Complete instructions: how to send, what to attach, when to follow up', 'Organized dashboard', 'Dedicated support for complex reports'],
    href: '/register?plan=pro',
    cta: 'Choose Pro',
    style: 'featured' as const,
  },
  {
    key: 'partner',
    name: 'Partner',
    price: '$299.99',
    per: '/mo',
    blurb: 'For tax and finance firms.',
    features: ['Everything in Pro for every client you invite', 'Your firm name and logo on client sign-up and dashboard', 'One private invite link for all your clients', 'Dashboard showing each client and their disputes', 'One flat monthly price, no per-client billing'],
    href: '/for-tax-pros',
    cta: 'See the firm plan',
    style: 'dashed' as const,
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col text-[#0D1B2E]">

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1426]/70 backdrop-blur-xl px-4 sm:px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
            <Link href="/" className="flex items-center" aria-label="Expunge home">
              <ExpungeLogo variant="primary" light width={136} height={34} />
            </Link>
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-white/70">
              <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
              <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              <Link href="/for-tax-pros" className="hover:text-white transition-colors">For tax firms</Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="hidden sm:inline text-sm font-medium text-white/70 hover:text-white transition-colors px-2">Sign in</Link>
              <Link
                href="/register"
                className="text-sm font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors rounded-xl px-4 py-2 shadow-[0_0_24px_rgba(249,115,22,0.45)]"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1426] pt-36 pb-24 sm:pt-44 sm:pb-32">
        {/* Background: grid + glows */}
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-60" />
        <div aria-hidden="true" className="absolute -top-40 left-1/2 -translate-x-1/2 h-[560px] w-[900px] rounded-full bg-[#F97316]/20 blur-[120px]" />
        <div aria-hidden="true" className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-[#1E3A5F]/70 blur-[100px]" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0B1426]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 lg:gap-12 items-center">
            {/* Copy */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white/80 mb-7">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22C55E]" />
                </span>
                Do-it-yourself dispute letters · You stay in control
              </div>

              <h1 className="text-[2.5rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem] font-bold tracking-[-0.035em] text-white">
                Find the errors on your credit report.{' '}
                <span className="text-gradient-orange">Get dispute letters you send yourself.</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-white/65 max-w-xl">
                Expunge reads your credit report, flags items that may be inaccurate or not yours, and drafts the dispute letters and instructions. You decide what to send, and you mail it.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] transition-colors px-7 py-4 text-base sm:text-lg font-bold text-white shadow-[0_0_40px_rgba(249,115,22,0.45)]"
                >
                  Check your report free
                  <Icon d={ICONS.arrow} className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors px-7 py-4 text-base sm:text-lg font-semibold text-white"
                >
                  See how it works
                </Link>
              </div>
              <p className="mt-4 text-sm text-white/45">No card needed for the free plan. Results vary.</p>
            </div>

            {/* Report mock */}
            <div className="relative animate-fade-in-up-delay-2">
              <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-[#F97316]/25 via-transparent to-[#4A7FA8]/25 blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 backdrop-blur-xl shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
                <div className="relative overflow-hidden rounded-xl bg-white">
                  {/* Scanning line */}
                  <div aria-hidden="true" className="scan-line pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F97316]/0 via-[#F97316]/15 to-[#F97316]/0" />

                  <div className="flex items-center justify-between bg-[#0D1B2E] px-5 py-3.5">
                    <div className="flex items-center gap-2.5 text-white">
                      <Icon d={ICONS.doc} className="w-4 h-4 text-[#F97316]" />
                      <span className="text-sm font-semibold">Report review</span>
                    </div>
                    <span className="text-[11px] uppercase tracking-wider text-white/45">Sample</span>
                  </div>

                  <ul className="divide-y divide-black/5">
                    {SAMPLE_ITEMS.map((item) => (
                      <li key={item.name} className="flex items-start justify-between gap-4 px-5 py-3.5">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D1B2E] truncate">{item.name}</div>
                          <div className="text-xs text-[#8A847E]">{item.detail}</div>
                        </div>
                        <span
                          className={`shrink-0 max-w-[55%] text-right text-[11px] sm:text-xs font-medium rounded-lg px-2.5 py-1 ${
                            item.tone === 'flag'
                              ? 'bg-[#FFF7ED] text-[#C2410C] ring-1 ring-[#FED7AA]'
                              : 'bg-[#F0FDF4] text-[#15803D] ring-1 ring-[#BBF7D0]'
                          }`}
                        >
                          {item.flag}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center justify-between gap-3 border-t border-black/5 bg-[#F6F5F4] px-5 py-3">
                    <span className="text-xs text-[#8A847E]">2 items may be wrong</span>
                    <span className="text-xs font-semibold text-[#EA580C]">2 draft letters for you to review</span>
                  </div>
                </div>
              </div>

              {/* Floating chip */}
              <div className="float-slow absolute -bottom-6 -left-4 sm:-left-8 hidden sm:flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                  <Icon d={ICONS.mail} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0D1B2E]">Letter marked as mailed</div>
                  <div className="text-[11px] text-[#8A847E]">We&apos;ll remind you when to check back</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10">
            {[
              { icon: ICONS.doc, top: 'All 3 bureaus', sub: 'Equifax, Experian, TransUnion' },
              { icon: ICONS.scale, top: 'Cites the FCRA', sub: 'Your federal dispute rights' },
              { icon: ICONS.lock, top: 'Encrypted', sub: 'In transit and at rest' },
              { icon: ICONS.shield, top: 'You mail it', sub: 'Expunge never files for you' },
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

      {/* ── How it works ────────────────────────────────── */}
      <section id="how-it-works" className="relative py-24 sm:py-32 bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F97316]">How it works</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Three steps to dispute errors</h2>
            <p className="mt-4 text-lg text-[#615D59]">From your report to letters you can mail. You make every decision along the way.</p>
          </div>

          <ol className="relative mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div aria-hidden="true" className="hidden md:block absolute top-10 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#F97316]/40 to-transparent" />
            {STEPS.map((s) => (
              <li key={s.n} className="group relative rounded-3xl border border-black/[0.07] bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(13,27,46,0.08)]">
                <div className="flex items-center justify-between">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D1B2E] text-[#F97316] shadow-[0_8px_24px_rgba(13,27,46,0.25)]">
                    <Icon d={s.icon} className="w-6 h-6" />
                  </div>
                  <span className="text-5xl font-bold text-black/[0.06] tabular-nums">{s.n}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-[#615D59]">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Features (bento) ────────────────────────────── */}
      <section id="features" className="py-24 sm:py-32 bg-[#F6F5F4] scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F97316]">What you get</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Clear letters. Clear next steps.</h2>
            <p className="mt-4 text-lg text-[#615D59]">Reading a credit report shouldn&apos;t need a lawyer&apos;s vocabulary. Expunge explains it and does the paperwork.</p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`glow-card relative overflow-hidden rounded-3xl border border-black/[0.07] bg-white p-7 ${f.wide ? 'md:col-span-2' : ''}`}
              >
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

      {/* ── Your rights (dark band) ─────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1426] py-24 sm:py-28">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-40" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-20 h-[420px] w-[620px] rounded-full bg-[#F97316]/15 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F97316]">Know your rights</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">Disputing errors is free. Doing it well takes work.</h2>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              You have the right to dispute inaccurate information directly with the credit bureaus, at no cost. The hard part is spotting the errors and writing a clear letter. That&apos;s the part Expunge helps with.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { t: 'Dispute errors, not the truth', b: 'Wrong balance, wrong date, an account that isn’t yours. Those are worth challenging.' },
              { t: 'Keep your receipts', b: 'Keep a copy of every letter, send it with tracking and write down the date.' },
              { t: 'Watch for the reply', b: 'The bureau generally has 30 days to look into a dispute (up to 45 in some cases) and must tell you what it found.' },
              { t: 'Skip the shortcuts', b: 'Never file a false identity theft report or use a CPN. Both can be crimes.' },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Icon d={ICONS.check} className="w-4 h-4 text-[#22C55E]" />
                  {x.t}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section id="pricing" className="py-24 sm:py-32 bg-white scroll-mt-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#F97316]">Pricing</p>
            <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-[-0.03em]">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-[#615D59]">Start free. Upgrade when you want more reports and all three bureaus.</p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLANS.map((p) => (
              <div
                key={p.key}
                className={`relative flex flex-col rounded-3xl p-6 ${
                  p.style === 'featured'
                    ? 'bg-[#0B1426] text-white ring-2 ring-[#F97316] shadow-[0_24px_60px_rgba(249,115,22,0.18)]'
                    : p.style === 'dashed'
                      ? 'bg-white border border-dashed border-black/20'
                      : 'bg-white border border-black/[0.08]'
                }`}
              >
                {p.style === 'featured' && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#F97316] px-3.5 py-1 text-[11px] font-bold tracking-wider text-white">
                    MOST COMPLETE
                  </div>
                )}
                <div className={`text-sm font-medium ${p.style === 'featured' ? 'text-white/60' : 'text-[#8A847E]'}`}>{p.name}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                  <span className={`text-base ${p.style === 'featured' ? 'text-white/50' : 'text-[#8A847E]'}`}>{p.per}</span>
                </div>
                <div className={`mt-1 text-sm ${p.style === 'featured' ? 'text-white/70' : 'text-[#615D59]'}`}>{p.blurb}</div>
                <ul className="mt-6 mb-8 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${p.style === 'featured' ? 'text-white/85' : 'text-[#374151]'}`}>
                      <Check />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {p.key === 'partner' && (
                  <p className="mb-4 text-xs text-[#8A847E]">Expunge prepares the letters and instructions. Your clients mail their own disputes.</p>
                )}
                <Link
                  href={p.href}
                  className={`block w-full rounded-xl py-3.5 text-center text-sm font-bold transition-colors ${
                    p.style === 'featured'
                      ? 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]'
                      : 'border border-black/10 text-[#374151] hover:bg-black/[0.03]'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#8A847E]">Paid plans renew monthly. Cancel any time. Results vary and are not guaranteed.</p>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="py-24 sm:py-28 bg-[#F6F5F4]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.03em] text-center">Straight answers</h2>
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
          <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.03em] text-white">Check your report for errors</h2>
          <p className="mt-5 text-lg text-white/65">
            Anyone can dispute errors with the bureaus for free. Expunge helps you find what may be wrong and write the letters, so you can handle it yourself.
          </p>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] transition-colors px-9 py-4 text-lg font-bold text-white shadow-[0_0_48px_rgba(249,115,22,0.5)]"
          >
            Start free
            <Icon d={ICONS.arrow} className="w-5 h-5" />
          </Link>
          <p className="mt-5 text-sm text-white/40">Free plan needs no card · Results vary · You mail every dispute yourself</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-white border-t border-black/[0.07] px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <ExpungeLogo variant="primary" width={130} height={32} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#8A847E]">
            <Link href="/for-tax-pros" className="hover:text-[#615D59] transition-colors">For tax firms</Link>
            <Link href="/terms" className="hover:text-[#615D59] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#615D59] transition-colors">Privacy</Link>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-xs leading-relaxed text-[#A39E98]">
          Expunge is software, not a law firm, and does not provide legal advice. Expunge does not remove items from credit reports and does not contact credit bureaus or creditors for you. You have the right to dispute inaccurate information with the credit bureaus directly, for free. Results vary.
        </p>
      </footer>
    </main>
  )
}
