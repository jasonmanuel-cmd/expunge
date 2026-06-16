import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: letter } = await supabase
      .from('letters')
      .select('*, dispute_items(cases(profiles(full_name, email)))')
      .eq('id', id)
      .single()

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    }

    const profile = letter.dispute_items?.cases?.profiles
    const caseOwnerId = letter.dispute_items?.cases?.user_id
    if (caseOwnerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Courier)
    const boldFont = await doc.embedFont(StandardFonts.CourierBold)
    const page = doc.addPage([612, 792])
    const { width, height } = page.getSize()
    const margin = 50
    const maxWidth = width - margin * 2
    let y = height - margin

    function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
      const lines: string[] = []
      const avgCharWidth = fontSize * 0.6
      const maxChars = Math.floor(maxWidth / avgCharWidth)
      for (let paragraph of text.split('\n')) {
        while (paragraph.length > maxChars) {
          let breakIdx = paragraph.lastIndexOf(' ', maxChars)
          if (breakIdx === -1) breakIdx = maxChars
          lines.push(paragraph.slice(0, breakIdx))
          paragraph = paragraph.slice(breakIdx).trimStart()
        }
        lines.push(paragraph)
      }
      return lines
    }

    function addLine(text: string, fontSize: number, opts?: { bold?: boolean; color?: number[] }) {
      const f = opts?.bold ? boldFont : font
      const c = opts?.color ? rgb(opts.color[0], opts.color[1], opts.color[2]) : rgb(0.1, 0.1, 0.1)
      page.drawText(text, { x: margin, y, size: fontSize, font: f, color: c })
      y -= fontSize * 1.4
    }

    function addWrapped(text: string, fontSize: number, opts?: { bold?: boolean }) {
      const lines = wrapText(text, maxWidth, fontSize)
      for (const line of lines) {
        if (y < margin + 40) {
          // Add new page
        }
        addLine(line, fontSize, opts)
      }
    }

    addLine(`Expunge — Dispute Letter`, 12, { bold: true, color: [0.05, 0.11, 0.18] })
    addLine(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 9, { color: [0.4, 0.4, 0.4] })
    y -= 10
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    addLine(`Consumer: ${profile?.full_name ?? 'Consumer'}`, 10)
    addLine(`Email: ${profile?.email ?? ''}`, 10)
    y -= 6
    addLine(`Bureau: ${letter.bureau.replace('_', ' ').toUpperCase()}`, 10, { bold: true })
    addLine(`Round: ${letter.round}${letter.is_cfpb_complaint ? ' (CFPB Complaint)' : ''}`, 10)
    y -= 10
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    const bodyLines = letter.content.split('\n')
    for (const line of bodyLines) {
      if (y < margin + 40) {
        const newPage = doc.addPage([612, 792])
        y = newPage.getSize().height - margin
      }
      addWrapped(line, 9)
    }

    const pdfBytes = Buffer.from(await doc.save())
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dispute-letter-${letter.bureau}-round-${letter.round}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
