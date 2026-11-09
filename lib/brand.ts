/**
 * Brand settings. Everything a licensee changes to run this app under their own
 * name lives here and is read from environment variables, with Expunge defaults.
 * See LICENSING.md.
 */
const domain = process.env.NEXT_PUBLIC_BRAND_DOMAIN || 'expunge.bond'

export const BRAND = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Expunge',
  domain,
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || `support@${domain}`,
  legalEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL || `legal@${domain}`,
  privacyEmail: process.env.NEXT_PUBLIC_PRIVACY_EMAIL || `privacy@${domain}`,
  /** Sender for transactional email. The domain must be verified in Resend. */
  emailFrom: process.env.EMAIL_FROM || `${process.env.NEXT_PUBLIC_BRAND_NAME || 'Expunge'} <notifications@${domain}>`,
} as const
