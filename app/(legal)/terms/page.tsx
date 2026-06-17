import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-[#6B7280] text-sm mb-10">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        {[
          {
            title: '1. Service Description',
            body: 'Expunge ("we," "us," "our") provides an AI-powered credit dispute automation platform ("Service") that helps consumers identify inaccurate items on their credit reports and generate dispute correspondence. Expunge is not a law firm, does not provide legal advice, and does not guarantee any specific outcome from the dispute process.',
          },
          {
            title: '2. Eligibility',
            body: 'You must be at least 18 years of age and a resident of the United States to use this Service. By creating an account, you represent that you meet these requirements and that all information you provide is accurate and current.',
          },
          {
            title: '3. User Responsibilities',
            body: 'You are responsible for: (a) maintaining the accuracy of information submitted to the Service; (b) the content of any dispute letters generated and sent on your behalf; (c) compliance with all applicable laws including the Fair Credit Reporting Act (FCRA) and Fair Debt Collection Practices Act (FDCPA); (d) maintaining the security of your account credentials.',
          },
          {
            title: '4. No Legal Advice',
            body: 'The Service provides informational resources and automated document generation based on publicly available law. Nothing in the Service constitutes legal advice. For legal questions specific to your situation, consult a licensed attorney. Dispute outcomes depend on many factors outside our control, including bureau and furnisher responses.',
          },
          {
            title: '5. Subscription and Billing',
            body: 'Paid subscriptions are billed monthly through Square. Subscriptions automatically renew unless canceled before the renewal date. Cancellation takes effect at the end of the current billing period. Refunds are not provided for partial subscription periods. We reserve the right to change pricing with 30 days notice.',
          },
          {
            title: '6. Prohibited Uses',
            body: 'You may not use the Service to: (a) file frivolous or fraudulent disputes; (b) dispute debts you know to be accurate and valid; (c) impersonate another person; (d) attempt to circumvent any technical limitations; (e) use the Service for any unlawful purpose.',
          },
          {
            title: '7. Intellectual Property',
            body: 'The Service, including its AI models, software, design, and content, is owned by Expunge and protected by intellectual property laws. Your dispute letters are your own. You grant us a limited license to process your data to provide the Service.',
          },
          {
            title: '8. Limitation of Liability',
            body: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, EXPUNGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE THREE MONTHS PRIOR TO THE CLAIM.',
          },
          {
            title: '9. Dispute Resolution',
            body: 'Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the American Arbitration Association rules, except that either party may seek injunctive relief in court for intellectual property violations.',
          },
          {
            title: '10. Changes to Terms',
            body: 'We may update these Terms at any time. We will notify you of material changes via email or in-app notice. Continued use of the Service after changes constitutes acceptance of the updated Terms.',
          },
          {
            title: '11. Contact',
            body: 'For questions about these Terms, contact us at legal@expunge.ai.',
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
