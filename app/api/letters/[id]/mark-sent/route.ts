import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { insert, q1, update } from '@/lib/db'
import { isUuid } from '@/lib/ids'

/**
 * POST /api/letters/[id]/mark-sent
 *
 * The consumer tells us they mailed this letter. Expunge never mails letters
 * itself, so this is the only thing that moves a letter from 'queued' to 'sent'
 * and starts the 30-day bureau response window the daily cron watches.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const letter = isUuid(id)
      ? await q1<{ id: string; bureau: string; dispute_item_id: string; owner_id: string }>(
          `select l.id, l.bureau, l.dispute_item_id, c.user_id as owner_id
             from letters l
             join dispute_items di on di.id = l.dispute_item_id
             join cases c on c.id = di.case_id
            where l.id = $1`,
          [id]
        )
      : null

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    }

    if (letter.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sentAt = new Date()
    const responseDueAt = new Date(sentAt)
    responseDueAt.setDate(responseDueAt.getDate() + 30)

    const queued = await q1<{ id: string }>(
      `select id from dispatch_records where letter_id = $1 and status = 'queued' limit 1`,
      [id]
    )

    const fields = {
      status: 'sent',
      sent_at: sentAt.toISOString(),
      response_due_at: responseDueAt.toISOString(),
    }

    if (queued) {
      await update('dispatch_records', fields, { id: queued.id })
    } else {
      const existing = await q1(
        `select id from dispatch_records where letter_id = $1 and sent_at is not null limit 1`,
        [id]
      )
      if (existing) {
        return NextResponse.json({ error: 'Already marked as mailed' }, { status: 409 })
      }
      await insert('dispatch_records', { letter_id: id, bureau: letter.bureau, ...fields })
    }

    await update('dispute_items', { status: 'dispatched' }, { id: letter.dispute_item_id })

    return NextResponse.json({ success: true, responseDueAt: responseDueAt.toISOString() })
  } catch (err) {
    console.error('Mark-sent error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
