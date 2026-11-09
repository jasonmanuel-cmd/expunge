import Link from 'next/link'
import { Check } from '@/components/marketing/icons'
import { FIRM_MONTHLY, FIRM_ANNUAL, FIRM_CUSTOM, type FirmOffer } from '@/lib/pricing'

const CTA: Record<FirmOffer['key'], { href: string; label: string }> = {
  partner: { href: '/register?plan=partner&role=partner', label: 'Start monthly' },
  partner_annual: { href: '/register?plan=partner_annual&role=partner', label: 'Get the annual license' },
  custom: { href: '/demo?interest=license', label: 'Request a quote' },
}

/**
 * The three firm offers. Prices come from lib/pricing.ts. Expunge has no
 * consumer plans, so nothing here is for individuals.
 */
export default function FirmPricing() {
  const offers = [FIRM_MONTHLY, FIRM_ANNUAL, FIRM_CUSTOM]
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
      {offers.map((o) => {
        const featured = o.key === 'partner_annual'
        return (
          <div
            key={o.key}
            className={`relative flex flex-col rounded-3xl p-8 ${
              featured
                ? 'bg-[#0B1426] text-white ring-2 ring-[#F97316] shadow-[0_24px_60px_rgba(249,115,22,0.18)]'
                : 'bg-white border border-black/10'
            }`}
          >
            {featured && (
              <div className="absolute -top-3 left-8 rounded-full bg-[#F97316] px-3.5 py-1 text-[11px] font-bold tracking-wider text-white">
                BEST VALUE
              </div>
            )}
            <div className={`text-sm font-medium ${featured ? 'text-white/60' : 'text-[#615D59]'}`}>{o.name}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight">{o.unit ? o.priceLabel.replace(o.unit, '') : o.priceLabel}</span>
              {o.unit && <span className={`text-base ${featured ? 'text-white/50' : 'text-[#8A847E]'}`}>{o.unit}</span>}
            </div>
            <div className={`mt-1 text-sm ${featured ? 'text-white/70' : 'text-[#615D59]'}`}>{o.billedAs}</div>
            <p className={`mt-4 text-sm leading-relaxed ${featured ? 'text-white/80' : 'text-[#374151]'}`}>{o.description}</p>
            <ul className="mt-6 mb-8 space-y-3">
              {o.features.map((f) => (
                <li key={f} className={`flex items-start gap-2 text-sm ${featured ? 'text-white/85' : 'text-[#374151]'}`}>
                  <Check />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={CTA[o.key].href}
              className={`mt-auto rounded-xl py-3.5 text-center text-sm font-bold transition-colors ${
                featured
                  ? 'bg-[#F97316] hover:bg-[#EA580C] text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]'
                  : 'border-2 border-black/10 hover:border-black/20 text-[#0D1B2E]'
              }`}
            >
              {CTA[o.key].label}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
