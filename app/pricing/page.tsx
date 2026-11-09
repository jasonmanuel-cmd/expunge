import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/marketing/SiteNav'
import SiteFooter from '@/components/marketing/SiteFooter'
import FirmPricing from '@/components/marketing/FirmPricing'

export const metadata: Metadata = {
  title: 'Pricing | Expunge firm licensing',
  description: 'Expunge is licensed to tax and finance firms monthly or by flat annual fee. No consumer plans.',
}

/** Firm-only pricing. Prices live in lib/pricing.ts. There are no consumer plans. */
export default function PricingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col text-[#0D1B2E]">
      <SiteNav />

      <section className="relative overflow-hidden bg-[#0B1426] pt-36 pb-16 sm:pt-44">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-60" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FB923C]">Pricing</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white">Licensed to firms, not consumers</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/65">
            Pay monthly, or once a year for a flat license. Every client your firm invites is included and never pays Expunge.
          </p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <FirmPricing />

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-black/10 pt-12 text-sm">
            {[
              {
                q: 'Can individuals buy it?',
                a: 'No. Expunge is sold only to businesses. Individuals get access through a firm that invites them.',
              },
              {
                q: 'Who is responsible for compliance?',
                a: 'Your firm. When you offer credit dispute help to clients, credit services laws may apply to your firm. Talk to an attorney before you offer it.',
              },
              {
                q: 'How do I pay?',
                a: 'Monthly by card through Square, or the annual license by card or invoice. Request a quote for white-label or outright purchase.',
              },
            ].map(({ q, a }) => (
              <div key={q}>
                <div className="font-semibold mb-2">{q}</div>
                <div className="text-[#615D59] leading-relaxed">{a}</div>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-xs text-[#8A847E]">
            See the <Link href="/terms" className="underline">Terms of Service</Link> and{' '}
            <Link href="/privacy" className="underline">Privacy Policy</Link>. Expunge is software, not a law firm, and does not provide legal advice.
          </p>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
