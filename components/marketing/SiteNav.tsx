import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

const LINKS = [
  { href: '/#platform', label: 'Platform' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/for-tax-pros', label: 'For tax pros' },
  { href: '/personal', label: 'For individuals' },
]

/** Floating glass nav used on every marketing page. Sits over a dark hero. */
export default function SiteNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B1426]/75 backdrop-blur-xl px-4 sm:px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <Link href="/" className="flex items-center" aria-label="Expunge home">
            <ExpungeLogo variant="primary" light width={136} height={34} />
          </Link>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-white/70">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="hidden sm:inline text-sm font-medium text-white/70 hover:text-white transition-colors px-2">Sign in</Link>
            <Link
              href="/demo"
              className="text-sm font-semibold text-white bg-[#F97316] hover:bg-[#EA580C] transition-colors rounded-xl px-4 py-2 shadow-[0_0_24px_rgba(249,115,22,0.45)]"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
