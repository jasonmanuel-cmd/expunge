import { BRAND } from '@/lib/brand'
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
        <p className="text-[#6B7280] text-sm mb-10">Last updated: November 9, 2026</p>

        <div className="mb-10 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-5 text-sm leading-relaxed text-[#374151]">
          Draft for attorney review. These terms describe Expunge as business software licensed to firms. They have not yet been reviewed by a lawyer.
        </div>

        {[
          {
            title: '1. What Expunge is',
            body: 'Expunge ("we," "us," "our") licenses software ("Service") to businesses, such as tax preparers, accountants, lenders and financial advisors ("Firms"). The Service helps a Firm\'s clients review their own credit reports and prepare dispute letters that the client reviews and mails personally. Expunge sells only to businesses. Expunge does not sell the Service to consumers, does not accept payment from consumers, and does not provide credit repair, credit counseling or any other credit service to consumers. Expunge does not contact credit bureaus, creditors or collectors on anyone\'s behalf, does not remove items from credit reports, and does not promise any result.',
          },
          {
            title: '2. Who these terms cover',
            body: 'These terms apply to (a) Firms that license the Service and their staff, and (b) individuals ("Clients") who use the Service because a Firm invited them. A Firm accepts these terms on behalf of its business; the person accepting represents they have authority to do so. Clients must be at least 18 and residents of the United States. Clients do not pay Expunge and do not have a contract with Expunge for any credit service.',
          },
          {
            title: '3. Firm responsibilities and compliance',
            body: 'Each Firm decides whether and how to offer the Service to its clients and is solely responsible for that decision. The Firm is responsible for its own compliance with all laws that apply to its business, which may include the federal Credit Repair Organizations Act, state credit services laws (such as California Civil Code section 1789.10 and following, which can require registration, a bond and written contracts), the Fair Credit Reporting Act, consumer protection, advertising and privacy laws. If a Firm charges its clients for anything related to credit, the Firm must first confirm with its own attorney that it may lawfully do so. Expunge does not provide legal advice and makes no representation that any Firm\'s use of the Service is lawful in its state.',
          },
          {
            title: '4. Client responsibilities',
            body: 'Clients are responsible for the accuracy of what they submit, for reviewing every letter before mailing it, and for only disputing information they believe in good faith is inaccurate or incomplete. Anyone can dispute inaccurate information with the credit bureaus directly, for free, without using the Service.',
          },
          {
            title: '5. No legal advice',
            body: 'The Service provides information and document drafting based on publicly available law. Nothing in the Service is legal advice. Expunge is not a law firm. For legal questions, consult a licensed attorney. Outcomes depend on credit bureaus and the companies that report to them, and accurate, current information can stay on a report.',
          },
          {
            title: '6. Licenses, fees and billing',
            body: 'Firms license the Service by monthly subscription, by annual license, or under a separate written agreement. Monthly subscriptions renew each month and annual subscriptions renew each year through Square unless canceled before renewal; cancellation takes effect at the end of the paid period. Annual licenses paid by invoice run for the period stated on the invoice. Each license includes the number of client seats shown for that plan at purchase, or the number stated in a separate agreement or invoice. A client seat is one client linked to the Firm\'s account. When every seat is taken, new clients cannot join, and clients linked beyond the seat count cannot start new reviews until a seat is freed or more seats are added. A Firm frees a seat by removing a client from its dashboard; the removed client keeps their account and past documents but is no longer covered by the Firm. Additional seats may be purchased on terms we agree in writing. Fees are not refunded for partial periods unless a separate agreement says otherwise. We may change prices with 30 days\' notice; changes apply from the next renewal. A license covers the Firm\'s own clients only and may not be resold or sublicensed without a written agreement.',
          },
          {
            title: '7. Prohibited uses',
            body: 'No one may use the Service to: (a) file frivolous or fraudulent disputes; (b) dispute information they know to be accurate; (c) impersonate another person or create false identity theft reports; (d) charge consumers fees in violation of law; (e) advertise that Expunge or a Firm removes accurate items, guarantees results or improves scores; (f) attempt to circumvent technical limits; or (g) use the Service for any unlawful purpose. We may suspend accounts that do.',
          },
          {
            title: '8. Data',
            body: 'A Firm can see its invited Clients\' names, emails and dispute status. Each Firm is responsible for using that information lawfully and only to serve its clients. Our Privacy Policy explains how we handle personal information.',
          },
          {
            title: '9. Intellectual property',
            body: 'The Service, including its software, AI prompts, design and content, is owned by Expunge and protected by intellectual property laws. Clients own the letters generated for them. Firms receive a limited, non-exclusive, non-transferable license to use the Service during their paid term.',
          },
          {
            title: '10. Limitation of liability and indemnity',
            body: 'TO THE MAXIMUM EXTENT PERMITTED BY LAW, EXPUNGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY TO A FIRM SHALL NOT EXCEED THE FEES THE FIRM PAID US IN THE THREE MONTHS BEFORE THE CLAIM. Each Firm agrees to defend and indemnify Expunge against claims arising from the Firm\'s offering of the Service to its clients, its fees to clients, its advertising, or its failure to comply with law.',
          },
          {
            title: '11. Dispute resolution',
            body: 'Disputes between Expunge and a Firm arising from these terms shall be resolved through binding arbitration under the American Arbitration Association\'s commercial rules, except that either party may seek injunctive relief in court for intellectual property violations.',
          },
          {
            title: '12. Changes to these terms',
            body: 'We may update these terms. We will notify Firms of material changes by email or in-app notice. Continued use after changes take effect means acceptance of the updated terms.',
          },
          {
            title: '13. Contact',
            body: `For questions about these terms, contact us at ${BRAND.legalEmail}.`,
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
