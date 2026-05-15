import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0D1B2E] flex flex-col text-[#F4F6F9]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={180} height={45} />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-[#4a7fa8] hover:text-white transition">
            Pricing
          </Link>
          <Link href="/login" className="text-sm text-[#4a7fa8] hover:text-white transition">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#E63946] hover:bg-[#c92e3a] transition px-5 py-2.5 rounded-lg font-bold text-white"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-flex items-center gap-2 bg-[#2D6BE4]/10 border border-[#2D6BE4]/30 rounded-full px-4 py-1.5 text-sm text-[#2D6BE4] mb-8">
          <span className="w-2 h-2 rounded-full bg-[#27AE60] animate-pulse" />
          AI-Powered Credit Dispute Automation
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight max-w-4xl leading-tight mb-6 font-[Georgia,serif]">
          Disputes filed.{' '}
          <span className="text-[#2D6BE4]">Records erased.</span>
        </h1>
        <p className="text-[#4a7fa8] text-xl max-w-2xl mb-10 leading-relaxed">
          Expunge analyzes your credit report, applies 30 years of FCRA case law,
          drafts legally precise dispute letters, and dispatches them to all three bureaus — automatically.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/register"
            className="bg-[#E63946] hover:bg-[#c92e3a] transition px-8 py-4 rounded-xl font-bold text-lg text-white"
          >
            Start free — no card required
          </Link>
          <Link
            href="/pricing"
            className="border border-white/20 hover:border-white/40 transition px-8 py-4 rounded-xl font-semibold text-lg text-[#4a7fa8] hover:text-white"
          >
            See pricing
          </Link>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-8 pb-24 max-w-6xl mx-auto w-full">
        {[
          { icon: '🤖', title: 'AI Analysis', desc: 'Master orchestrator classifies every negative item with FCRA legal basis' },
          { icon: '⚖️', title: '8 Specialist Agents', desc: 'Dedicated agents for bankruptcy, collections, fraud, inquiries, and more' },
          { icon: '📬', title: 'Tri-Bureau Dispatch', desc: 'Letters sent to Equifax, Experian, and TransUnion simultaneously' },
          { icon: '📊', title: '30-Day Monitoring', desc: 'Outcome tracker watches every case and escalates automatically' },
        ].map((f) => (
          <div key={f.title} className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-6">
            <div className="text-3xl mb-3">{f.icon}</div>
            <div className="font-semibold mb-1">{f.title}</div>
            <div className="text-[#4a7fa8] text-sm">{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  )
}
