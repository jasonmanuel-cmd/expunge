import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: letter } = await supabase
      .from('letters')
      .select('id, bureau, dispute_item_id, dispute_items(cases(user_id))')
      .eq('id', id)
      .single()

    if (!letter) {
      return NextResponse.json({ error: 'Letter not found' }, { status: 404 })
    }

    const item = letter.dispute_items as unknown as { cases?: { user_id?: string } } | null
    if (item?.cases?.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sentAt = new Date()
    const responseDueAt = new Date(sentAt)
    responseDueAt.setDate(responseDueAt.getDate() + 30)

    const { data: queued } = await supabase
      .from('dispatch_records')
      .select('id')
      .eq('letter_id', id)
      .eq('status', 'queued')
      .limit(1)
      .maybeSingle()

    const update = {
      status: 'sent',
      sent_at: sentAt.toISOString(),
      response_due_at: responseDueAt.toISOString(),
    }

    if (queued) {
      const { error } = await supabase.from('dispatch_records').update(update).eq('id', queued.id)
      if (error) throw error
    } else {
      const { data: existing } = await supabase
        .from('dispatch_records')
        .select('id')
        .eq('letter_id', id)
        .not('sent_at', 'is', null)
        .limit(1)
        .maybeSingle()
      if (existing) {
        return NextResponse.json({ error: 'Already marked as mailed' }, { status: 409 })
      }
      const { error } = await supabase
        .from('dispatch_records')
        .insert({ letter_id: id, bureau: letter.bureau, ...update })
      if (error) throw error
    }

    await supabase
      .from('dispute_items')
      .update({ status: 'dispatched' })
      .eq('id', letter.dispute_item_id)

    return NextResponse.json({ success: true, responseDueAt: responseDueAt.toISOString() })
  } catch (err) {
    console.error('Mark-sent error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
