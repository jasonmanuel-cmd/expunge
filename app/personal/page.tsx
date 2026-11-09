import Link from 'next/link'
import type { Metadata } from 'next'
import SiteNav from '@/components/marketing/SiteNav'
import SiteFooter from '@/components/marketing/SiteFooter'

export const metadata: Metadata = {
  title: 'Expunge for individuals | Available through your firm',
  description:
    'Expunge is business software sold to tax and finance firms. Individuals get access through a firm that invites them. Anyone can dispute credit report errors with the bureaus directly, for free.',
}

/*
 * Expunge has no consumer plans and never takes payment from consumers.
 * This page only explains how individuals get access (through a firm) and that
 * they can always dispute errors themselves for free. Don't add prices,
 * sign-up buttons or checkout here.
 */

const STEPS = [
  {
    title: 'Ask your firm',
    body: 'Tax preparers, bookkeepers, loan officers and financial coaches use Expunge with their clients. Ask yours whether they offer it.',
  },
  {
    title: 'Use their invite link',
    body: 'Your firm sends you a private link. Open it to create your account. Your access is covered by the firm, and Expunge never bills you.',
  },
  {
    title: 'Review your report',
    body: 'Upload your report, see which items may be inaccurate, and get letters you review and mail yourself. Results vary.',
  },
]

export default function PersonalPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col text-[#0D1B2E]">
      <SiteNav />

      <section className="relative overflow-hidden bg-[#0B1426] pt-36 pb-20 sm:pt-44">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-60" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FB923C]">For individuals</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white">
            Expunge is available through your firm
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-white/65">
            Expunge is business software sold to tax and finance firms. We don&apos;t sell plans to individuals and
            we never take payment from consumers.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-black/10 p-6">
              <div className="text-sm font-semibold text-[#F97316]">0{i + 1}</div>
              <h2 className="mt-2 text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#615D59]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-24 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-3xl border border-black/10 bg-[#F6F5F4] p-7 text-sm leading-relaxed text-[#374151]">
            <div className="text-base font-semibold text-[#0D1B2E]">You can always do it yourself, for free</div>
            <p className="mt-2">
              You have the right to dispute inaccurate information directly with Equifax, Experian and TransUnion at
              no cost, and to get free copies of your credit reports at annualcreditreport.com. You don&apos;t need
              Expunge or anyone else to do that.
            </p>
          </div>
          <p className="mt-8 text-center text-sm text-[#8A847E]">
            Run a firm? <Link href="/" className="font-semibold text-[#615D59] underline underline-offset-2">See Expunge for firms</Link>.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
