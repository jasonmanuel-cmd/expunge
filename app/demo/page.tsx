import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/marketing/SiteNav'
import SiteFooter from '@/components/marketing/SiteFooter'
import { Icon, Check, ICONS } from '@/components/marketing/icons'
import { BRAND } from '@/lib/brand'
import DemoRequestForm from './DemoRequestForm'

export const metadata: Metadata = {
  title: 'Book a demo | Expunge for tax and finance firms',
  description: 'See the branded client portal, the firm dashboard and how clients join from your invite link.',
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col text-[#0D1B2E]">
      <SiteNav />

      <section className="relative overflow-hidden bg-[#0B1426] pt-36 pb-24 sm:pt-44">
        <div aria-hidden="true" className="absolute inset-0 hero-grid opacity-60" />
        <div aria-hidden="true" className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[860px] rounded-full bg-[#F97316]/20 blur-[120px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 items-start">
          <div className="animate-fade-in-up">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#FB923C]">Book a demo</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-[-0.03em] text-white">See Expunge with your firm&apos;s name on it</h1>
            <p className="mt-5 text-lg leading-relaxed text-white/65">
              Tell us a little about your firm. We&apos;ll set up a short walkthrough of the client portal, the firm dashboard and how clients join from your link.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'The client portal, shown with your logo',
                'How clients review their report and mail their own letters',
                'Your firm dashboard and invite link',
                'Pricing, setup and questions to take to your attorney',
              ].map((x) => (
                <li key={x} className="flex items-start gap-2 text-white/80">
                  <Check />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/60">
              Rather email? Write to{' '}
              <a href={`mailto:${BRAND.salesEmail}`} className="font-semibold text-white underline underline-offset-2">{BRAND.salesEmail}</a>.
              <div className="mt-3">
                Ready now? <Link href="/register?plan=partner&role=partner" className="font-semibold text-[#FB923C] hover:text-[#FDBA74]">Start your firm plan</Link>.
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in-up-delay-2">
            <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-[#F97316]/25 via-transparent to-[#4A7FA8]/25 blur-2xl" />
            <div className="relative rounded-3xl border border-white/10 bg-white p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#F97316]">
                  <Icon d={ICONS.calendar} className="w-5 h-5" />
                </div>
                <div className="text-lg font-bold">Request a walkthrough</div>
              </div>
              <DemoRequestForm to={BRAND.salesEmail} />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
