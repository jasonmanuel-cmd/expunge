import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = 'Expunge <notifications@expunge.ai>'

function isConfigured(): boolean {
  if (!resend) {
    console.log('[Email] Resend not configured — set RESEND_API_KEY to enable')
    return false
  }
  return true
}

export async function sendLettersReadyEmail(
  to: string,
  name: string,
  caseId: string,
  itemCount: number
): Promise<void> {
  if (!isConfigured()) return
  try {
    await resend!.emails.send({
      from: FROM,
      to,
      subject: `Your dispute letters are ready — ${itemCount} items filed`,
      text: `Hi ${name},\n\nYour dispute letters have been generated and are ready for download.\n\nItems disputed: ${itemCount}\n\nView them in your dashboard:\n${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}\n\nYou can download each letter as a PDF from the detail view.\n\n— Expunge`,
    })
  } catch (err) {
    console.error('[Email] Failed to send letters-ready notification:', err)
  }
}

export async function sendOutcomeEmail(
  to: string,
  name: string,
  accountName: string,
  bureau: string,
  result: string,
  caseId: string
): Promise<void> {
  if (!isConfigured()) return
  try {
    await resend!.emails.send({
      from: FROM,
      to,
      subject: `Dispute outcome received — ${accountName} (${bureau})`,
      text: `Hi ${name},\n\nWe received an outcome for your dispute:\n\nAccount: ${accountName}\nBureau: ${bureau}\nResult: ${result.toUpperCase()}\n\nView full details:\n${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}\n\n— Expunge`,
    })
  } catch (err) {
    console.error('[Email] Failed to send outcome notification:', err)
  }
}

export async function sendNoResponseEmail(
  to: string,
  name: string,
  accountName: string,
  bureau: string,
  caseId: string
): Promise<void> {
  if (!isConfigured()) return
  try {
    await resend!.emails.send({
      from: FROM,
      to,
      subject: `No response from ${bureau} — escalation available`,
      text: `Hi ${name},\n\nThe 30-day response window has expired for your dispute:\n\nAccount: ${accountName}\nBureau: ${bureau}\n\nYou can escalate this dispute (Round 2 letter + CFPB complaint) from your dashboard.\n\nView:\n${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}\n\n— Expunge`,
    })
  } catch (err) {
    console.error('[Email] Failed to send no-response notification:', err)
  }
}
