import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-8 py-5">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-16">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-[#6B7280] text-sm mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {[
          {
            title: 'Information We Collect',
            body: 'We collect: (a) Account information (name, email, password hash); (b) Credit report content you submit for dispute analysis; (c) Dispute history and outcomes; (d) Payment information processed by Square (we do not store raw card numbers); (e) Usage data and logs.',
          },
          {
            title: 'How We Use Your Information',
            body: 'Your data is used to: provide and improve the Service; generate dispute letters; track dispute outcomes; train and improve our AI models (using anonymized, aggregated patterns only); process payments; communicate with you about your account; comply with legal obligations.',
          },
          {
            title: 'Credit Report Data',
            body: 'Credit report text you submit is sensitive financial information. It is stored encrypted in our database, used only to generate your disputes, and is not sold to or shared with third parties. You may request deletion of your credit report data at any time by contacting privacy@expunge.ai.',
          },
          {
            title: 'Data Sharing',
            body: 'We do not sell your personal data. We share data only with: (a) Supabase (database hosting); (b) Anthropic (AI processing — data subject to their privacy policy); (c) Square (payment processing); (d) Law enforcement when legally required. All processors are bound by data processing agreements.',
          },
          {
            title: 'Data Security',
            body: 'We use industry-standard encryption (TLS in transit, AES-256 at rest), row-level security in our database, and access controls. However, no system is 100% secure. In the event of a breach affecting your data, we will notify you as required by law.',
          },
          {
            title: 'Your Rights',
            body: 'You have the right to: access, correct, or delete your personal data; opt out of marketing communications; request a copy of your data in a portable format; withdraw consent where processing is consent-based. To exercise these rights, email privacy@expunge.ai.',
          },
          {
            title: 'California Residents (CCPA)',
            body: 'California residents have additional rights under the CCPA including the right to know what personal information is collected and shared, the right to delete, and the right to opt out of sale (we do not sell personal information). To exercise CCPA rights, contact privacy@expunge.ai.',
          },
          {
            title: 'Cookies',
            body: 'We use essential cookies for authentication (Supabase session) and no third-party tracking cookies. We do not use advertising cookies.',
          },
          {
            title: 'Children',
            body: 'The Service is not directed at children under 18. We do not knowingly collect data from minors.',
          },
          {
            title: 'Contact',
            body: 'For privacy questions or requests: privacy@expunge.ai. We will respond within 30 days.',
          },
        ].map(({ title, body }) => (
          <div key={title} className="mb-8">
            <h2 className="text-xl font-semibold mb-3 text-[#111827]">{title}</h2>
            <p className="text-[#6B7280] leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
