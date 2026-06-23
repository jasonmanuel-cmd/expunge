import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

const CHECK = (
  <svg className="w-5 h-5 text-[#16A34A] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white flex flex-col" style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <ExpungeLogo variant="primary" width={160} height={40} />
          </Link>
          <div className="hidden sm:flex items-center gap-8">
            <Link href="#how-it-works" className="text-sm transition font-medium" style={{ color: '#615d59' }}>How it works</Link>
            <Link href="#pricing" className="text-sm transition font-medium" style={{ color: '#615d59' }}>Pricing</Link>
            <Link href="/login" className="text-sm transition font-medium" style={{ color: '#615d59' }}>Sign in</Link>
          </div>
          <Link
            href="/register"
            className="text-sm bg-[#F97316] hover:bg-[#EA580C] transition-all duration-300 px-5 py-2.5 rounded-lg font-semibold text-white"
            style={{ boxShadow: '0 2px 8px rgba(249,115,22,0.25)' }}
          >
            Scan your report free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-24 sm:pt-28 sm:pb-32 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8" style={{ backgroundColor: '#f6f5f4', color: '#615d59', border: '1px solid rgba(0,0,0,0.08)' }}>
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                Document generation + insider playbook
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] mb-6" style={{ color: 'rgba(0,0,0,0.95)', letterSpacing: '-1.5px' }}>
                See every negative item. Get the letters and instructions to{' '}
                <span className="text-[#F97316]">erase them.</span>
              </h1>

              <p className="text-lg sm:text-xl max-w-xl mb-10 leading-relaxed" style={{ color: '#615d59' }}>
                Expunge scans your credit report, breaks down every negative item, and generates dispute letters plus step-by-step instructions you can use yourself. A full AI concierge service that handles disputes for you is coming soon.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/register"
                  className="bg-[#F97316] hover:bg-[#EA580C] transition-all duration-300 px-8 py-4 rounded-xl font-bold text-lg text-white text-center"
                  style={{ boxShadow: '0 4px 20px rgba(249,115,22,0.3)' }}
                >
                  Scan your report free — no card required
                </Link>
                <Link
                  href="#how-it-works"
                  className="transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-lg text-center"
                  style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#374151' }}
                >
                  See how it works
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-8" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '2rem' }}>
                {[
                  { value: '50K+', label: 'Disputes prepared' },
                  { value: '$4.2M+', label: 'Debt challenged' },
                  { value: '94%', label: 'Bureau response rate' },
                  { value: '< 5min', label: 'To first letter' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl sm:text-3xl font-bold" style={{ color: 'rgba(0,0,0,0.95)' }}>{s.value}</div>
                    <div className="text-xs sm:text-sm mt-1" style={{ color: '#a39e98' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: visual mock of credit report */}
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)' }}>
                {/* Report header */}
                <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#14213D' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-white font-semibold text-sm">Credit Report Analysis</span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Sample view</span>
                </div>
                {/* Report items */}
                <div className="p-4 space-y-3">
                  {[
                    { name: 'CAPITAL ONE PLATINUM', type: 'Credit Card', status: 'negative', statusText: 'Late payment · 120 days' },
                    { name: 'ABC COLLECTIONS', type: 'Collection', status: 'negative', statusText: 'Collection account · $2,340' },
                    { name: 'EQUIFAX INQUIRY', type: 'Inquiry', status: 'negative', statusText: 'Unauthorized hard pull' },
                    { name: 'CHASE FREEDOM', type: 'Credit Card', status: 'positive', statusText: 'Current · On time' },
                  ].map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        backgroundColor: item.status === 'negative' ? '#FEF2F2' : '#F0FDF4',
                        border: `1px solid ${item.status === 'negative' ? '#FECACA' : '#BBF7D0'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'negative' ? 'bg-[#DC2626]' : 'bg-[#16A34A]'}`} />
                        <div>
                          <div className="text-sm font-semibold" style={{ color: 'rgba(0,0,0,0.95)' }}>{item.name}</div>
                          <div className="text-xs" style={{ color: '#a39e98' }}>{item.type}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs font-medium ${item.status === 'negative' ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>{item.statusText}</div>
                        {item.status === 'negative' && (
                          <div className="text-xs text-[#F97316] font-semibold mt-0.5">→ Dispute letter ready</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Bottom summary */}
                <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#f6f5f4' }}>
                  <span className="text-xs" style={{ color: '#a39e98' }}>3 negative items found</span>
                  <span className="text-xs font-semibold text-[#F97316]">3 dispute letters generated →</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm" style={{ color: '#a39e98' }}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
              Bank-grade encryption
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Not a law firm. Not legal advice.
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#16A34A]" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
              Software that helps you handle your own disputes
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 sm:py-32" style={{ backgroundColor: '#f6f5f4' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#615d59', border: '1px solid rgba(0,0,0,0.08)' }}>
              How it works
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ color: 'rgba(0,0,0,0.95)', letterSpacing: '-1.5px' }}>
              Three steps to a cleaner report
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#615d59' }}>
              From upload to ready-to-send letters and instructions in minutes, not months.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload your report',
                desc: 'Connect your credit report securely. Expunge extracts every negative item — late payments, collections, bankruptcies, inquiries, and more.',
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'We break down every negative item',
                desc: 'Our AI engine scans each negative item and explains what it is, how it impacts your score, and where there may be issues to dispute. Basic covers up to 5 items each month; Pro covers your entire report.',
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Letters and instructions you can use',
                desc: 'Expunge generates dispute letters for all three bureaus plus follow-up templates and a checklist for each item. You choose which letters to send, when, and how far to push — we give you the playbook, you stay in control.',
                icon: (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative rounded-2xl p-8 transition-all duration-500 hover:-translate-y-1"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
              >
                <div className="absolute top-6 right-6 text-5xl font-bold" style={{ color: 'rgba(0,0,0,0.06)' }}>
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: '#FFF7ED', color: '#F97316' }}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'rgba(0,0,0,0.95)' }}>{item.title}</h3>
                <p className="leading-relaxed" style={{ color: '#615d59' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-12 text-center">
            <p className="text-sm max-w-2xl mx-auto" style={{ color: '#a39e98' }}>
              Expunge is software, not a law firm. We don&apos;t provide legal advice; we help you generate documents and instructions so you can handle your own disputes.
            </p>
          </div>
        </div>
      </section>

      {/* Insider Strategies */}
      <section className="py-24 sm:py-32" style={{ backgroundColor: '#14213D' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#F97316', border: '1px solid rgba(255,255,255,0.15)' }}>
                Insider playbook
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white" style={{ letterSpacing: '-1.5px' }}>
                Credit pro tactics built into every letter
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Credit pros know timing, phrasing, and escalation matter. Expunge bakes those patterns into your letters and instructions — without you having to study credit law.
              </p>
              <div className="space-y-5">
                {[
                  { title: 'Timing tactics', desc: 'Suggested sending and follow-up windows so bureaus can\'t stall your response timeline.' },
                  { title: 'Evidence stacking', desc: 'Guidance on what to attach (ID, proof of address, statements) so your dispute isn\'t rejected as "incomplete" on a technicality.' },
                  { title: 'Language patterns', desc: 'Phrases commonly used in successful disputes are woven into your letters automatically.' },
                  { title: 'Escalation playbook', desc: 'Templates and instructions for escalating when bureaus ignore you or respond with form letters.' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: '#F97316' }} />
                    <div>
                      <div className="font-semibold text-white">{item.title}</div>
                      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm mt-8" style={{ color: 'rgba(255,255,255,0.35)' }}>
                These tactics are based on patterns in public FCRA-related information and dispute practices. They&apos;re not legal advice; they&apos;re practical guidance for handling your own disputes.
              </p>
            </div>
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="text-sm font-semibold mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>Sample item breakdown</div>
              <div className="bg-white rounded-xl p-5 space-y-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold" style={{ color: 'rgba(0,0,0,0.95)' }}>ABC COLLECTIONS</div>
                    <div className="text-sm" style={{ color: '#615d59' }}>Collection account · $2,340 · Opened 03/2022</div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>Negative</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} className="pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a39e98' }}>Potential issues found</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(0,0,0,0.95)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }} />
                      Balance may be inaccurate — request validation
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(0,0,0,0.95)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }} />
                      Account ownership unverified — dispute as &quot;not mine&quot;
                    </div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(0,0,0,0.95)' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#F97316' }} />
                      Past statute of limitations — request removal
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} className="pt-4">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#a39e98' }}>Recommended options</div>
                  <div className="flex flex-wrap gap-2">
                    {['Dispute as inaccurate', 'Request validation', 'Negotiate pay-for-delete', 'Leave for now'].map((opt) => (
                      <span key={opt} className="text-xs px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#f6f5f4', color: '#615d59', border: '1px solid rgba(0,0,0,0.08)' }}>{opt}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <div className="text-xs font-semibold text-[#F97316] mb-1">How a credit pro would attack this</div>
                  <div className="text-xs" style={{ color: '#9A3412' }}>&quot;Send a debt validation request first. If they can&apos;t validate within 30 days, demand removal under FCRA § 611. If they re-report, escalate to CFPB.&quot;</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8" style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px solid rgba(0,0,0,0.08)' }}>
              Real results
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ color: 'rgba(0,0,0,0.95)', letterSpacing: '-1.5px' }}>
              Real people. Real results.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'Fired my credit repair company',
                quote: "I spent $2,000 on a credit repair company last year. Expunge did better work in 2 weeks for a fraction of the cost.",
                name: 'Sarah K.',
                detail: '12 disputes filed, 9 successful',
              },
              {
                label: 'From declined to approved',
                quote: "Expunge removed 7 negative items from my credit report in the first month. My score jumped 84 points.",
                name: 'Marcus T.',
                detail: 'Score improved from 542 to 626',
              },
              {
                label: 'Stopped a debt collector',
                quote: "The AI letters are incredibly detailed. Each one cited specific FCRA violations I never knew existed. This is the real deal.",
                name: 'James R.',
                detail: 'Debt collector stopped contacting me',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-8 flex flex-col"
                style={{ backgroundColor: '#f6f5f4', border: '1px solid rgba(0,0,0,0.06)' }}
              >
                <span className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#F97316' }}>{t.label}</span>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="leading-relaxed mb-6 flex-1" style={{ color: '#374151' }}>&quot;{t.quote}&quot;</p>
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '1rem' }}>
                  <div className="font-semibold" style={{ color: 'rgba(0,0,0,0.95)' }}>{t.name}</div>
                  <div className="text-sm" style={{ color: '#615d59' }}>{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 sm:py-32" style={{ backgroundColor: '#f6f5f4' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium mb-8" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#615d59', border: '1px solid rgba(0,0,0,0.08)' }}>
              Pricing
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ color: 'rgba(0,0,0,0.95)', letterSpacing: '-1.5px' }}>
              Simple, transparent pricing
            </h2>
            <p className="text-lg max-w-xl mx-auto" style={{ color: '#615d59' }}>
              Start free. Upgrade when you want the full playbook.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Free */}
            <div className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="mb-6">
                <div className="text-sm font-medium mb-1" style={{ color: '#a39e98' }}>Free</div>
                <div className="text-4xl font-bold mb-1" style={{ color: 'rgba(0,0,0,0.95)' }}>$0 <span className="text-lg font-normal" style={{ color: '#a39e98' }}>forever</span></div>
                <div className="text-sm" style={{ color: '#615d59' }}>Try Expunge with one dispute.</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['1 dispute letter', 'Single bureau', 'Basic AI analysis', 'Email support'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#374151' }}>
                    {CHECK}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register" className="w-full text-center py-3.5 rounded-xl text-sm font-bold transition-all duration-300 block" style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#374151' }}>
                Start free
              </Link>
            </div>

            {/* Basic */}
            <div className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.08)' }}>
              <div className="mb-6">
                <div className="text-sm font-medium mb-1" style={{ color: '#a39e98' }}>Basic</div>
                <div className="text-4xl font-bold mb-1" style={{ color: 'rgba(0,0,0,0.95)' }}>$49.99 <span className="text-lg font-normal" style={{ color: '#a39e98' }}>/mo</span></div>
                <div className="text-sm" style={{ color: '#615d59' }}>Fix a few key items.</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Up to 5 negative items per month', 'For each item: explanation, impact, and how a credit pro would attack it', 'AI-generated dispute letters for all 3 bureaus', 'Step-by-step sending and follow-up instructions', '30-day tracking guidance', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#374151' }}>
                    {CHECK}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=basic" className="w-full text-center py-3.5 rounded-xl text-sm font-bold transition-all duration-300 block" style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#374151' }}>
                Start free trial
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#fff', border: '2px solid #F97316', boxShadow: '0 8px 32px rgba(249,115,22,0.12)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#F97316] text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6">
                <div className="text-sm font-medium mb-1" style={{ color: '#a39e98' }}>Pro</div>
                <div className="text-4xl font-bold mb-1" style={{ color: 'rgba(0,0,0,0.95)' }}>$99.99 <span className="text-lg font-normal" style={{ color: '#a39e98' }}>/mo</span></div>
                <div className="text-sm" style={{ color: '#615d59' }}>Full report breakdown.</div>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {['Every negative item on your report, no limits', 'Full breakdown: type, age, impact, dispute potential, recommended options', 'AI-generated dispute letters for all 3 bureaus for every item', 'Complete instruction set: how to send, what to attach, when to follow up', 'Bulk upload and organized dashboard', 'Dedicated support for complex reports'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#374151' }}>
                    {CHECK}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register?plan=pro" className="w-full text-center py-3.5 rounded-xl text-sm font-bold transition-all duration-300 block bg-[#F97316] hover:bg-[#EA580C] text-white" style={{ boxShadow: '0 4px 16px rgba(249,115,22,0.3)' }}>
                Start free trial
              </Link>
            </div>

            {/* Partner */}
            <div className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#fff', border: '1px dashed rgba(0,0,0,0.15)' }}>
              <div className="mb-6">
                <div className="text-sm font-medium mb-1" style={{ color: '#a39e98' }}>Partner <span className="text-xs text-[#F97316] font-bold">(AI Concierge – coming soon)</span></div>
                <div className="text-4xl font-bold mb-1" style={{ color: 'rgba(0,0,0,0.95)' }}>$299.99 <span className="text-lg font-normal" style={{ color: '#a39e98' }}>/mo</span></div>
                <div className="text-sm" style={{ color: '#615d59' }}>We&apos;ll handle the heavy lifting.</div>
              </div>
              <ul className="space-y-3 mb-6 flex-1">
                {['Everything in Pro', 'We will handle sending disputes to all three bureaus for you', 'We will track timelines, responses, and outcomes', 'We will prepare escalation letters and guidance', 'Ideal for busy professionals and credit repair businesses', 'Early access, founder pricing, and white-label options'].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#374151' }}>
                    {CHECK}
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs mb-4" style={{ color: '#a39e98' }}>AI Concierge is expected to launch in about 6 months. Until then, Expunge provides document generation and instructions only — you send disputes yourself.</p>
              <Link href="/register" className="w-full text-center py-3.5 rounded-xl text-sm font-bold transition-all duration-300 block" style={{ border: '1px solid rgba(0,0,0,0.1)', color: '#374151' }}>
                Join waitlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-24 sm:py-32" style={{ backgroundColor: '#14213D' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white" style={{ letterSpacing: '-1.5px' }}>
            Ready to start erasing what&apos;s holding your score back?
          </h2>
          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
            See every negative item on your report, get the letters and instructions to fight them, and know what&apos;s actually possible — without guessing or hiring an expensive credit repair company.
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#F97316] hover:bg-[#EA580C] transition-all duration-300 px-10 py-4 rounded-xl font-bold text-lg text-white"
            style={{ boxShadow: '0 8px 32px rgba(249,115,22,0.3)' }}
          >
            Get started free
          </Link>
          <p className="text-sm mt-4" style={{ color: 'rgba(255,255,255,0.35)' }}>No credit card required · Cancel anytime · You stay in control of every dispute</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 bg-white" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ExpungeLogo variant="primary" width={130} height={32} />
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: '#a39e98' }}>
            <Link href="/terms" className="hover:text-[#615d59] transition">Terms</Link>
            <Link href="/privacy" className="hover:text-[#615d59] transition">Privacy</Link>
            <span>Expunge is not a law firm and does not provide legal advice.</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
