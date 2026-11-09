import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

const COLUMNS = [
  {
    title: 'For firms',
    links: [
      { href: '/#platform', label: 'Platform' },
      { href: '/#pricing', label: 'Firm pricing' },
      { href: '/for-tax-pros', label: 'For tax preparers' },
      { href: '/demo', label: 'Book a demo' },
    ],
  },
  {
    title: 'For individuals',
    links: [
      { href: '/personal', label: 'How it works' },
      { href: '/personal#pricing', label: 'Personal plans' },
      { href: '/register', label: 'Start free' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="bg-white border-t border-black/[0.07] px-4 sm:px-6 pt-14 pb-10">
      <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10">
        <div className="col-span-2 md:col-span-1">
          <ExpungeLogo variant="primary" width={130} height={32} />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#8A847E]">
            Credit report review and dispute letter software for tax and finance firms and the clients they serve.
          </p>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <div className="text-sm font-semibold text-[#0D1B2E]">{c.title}</div>
            <ul className="mt-3 space-y-2 text-sm text-[#8A847E]">
              {c.links.map((l) => (
                <li key={l.href}><Link href={l.href} className="hover:text-[#615D59] transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-6xl border-t border-black/[0.06] pt-6 text-xs leading-relaxed text-[#A39E98]">
        Expunge is software, not a law firm, and does not provide legal advice. Expunge does not remove items from credit reports and does not contact credit bureaus or creditors for anyone. Users review and mail their own dispute letters. Anyone can dispute inaccurate information with the credit bureaus directly, for free. Results vary.
      </p>
    </footer>
  )
}
