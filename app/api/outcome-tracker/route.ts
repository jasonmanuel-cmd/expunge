import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { insert, q, q1, tx, update } from '@/lib/db'
import { isUuid } from '@/lib/ids'
import { processOutcome } from '@/lib/agents/learning-agent'
import { sendOutcomeEmail } from '@/lib/email'
import type { DisputeType, Bureau, OutcomeResult } from '@/lib/types'

/** Everything about one dispatch record that the outcome flow needs. */
interface DispatchContext {
  id: string
  bureau: string
  sent_at: string | null
  dispute_item_id: string
  letter_content: string | null
  item_type: string
  legal_basis: string | null
  round: number | null
  account_name: string
  amount: number | null
  dispute_reason: string | null
  specialist_output: { strategy?: string; letterTone?: string } | null
  case_id: string
  owner_id: string
  full_name: string | null
  email: string | null
  [key: string]: unknown
}

const DISPATCH_CONTEXT_SQL = `
  select dr.id, dr.bureau, dr.sent_at,
         l.dispute_item_id, l.content as letter_content,
         di.type as item_type, di.legal_basis, di.round, di.account_name, di.amount,
         di.dispute_reason, di.specialist_output,
         c.id as case_id, c.user_id as owner_id,
         p.full_name, p.email
    from dispatch_records dr
    join letters l on l.id = dr.letter_id
    join dispute_items di on di.id = l.dispute_item_id
    join cases c on c.id = di.case_id
    left join profiles p on p.id = c.user_id`

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { dispatchRecordId, result, scoreImpactPoints, notes } = await req.json()
    if (!['removed', 'modified', 'verified', 'no_response'].includes(result)) {
      return NextResponse.json({ error: 'Invalid result' }, { status: 400 })
    }

    const dispatch = isUuid(dispatchRecordId)
      ? await q1<DispatchContext>(`${DISPATCH_CONTEXT_SQL} where dr.id = $1`, [dispatchRecordId])
      : null

    if (!dispatch) {
      return NextResponse.json({ error: 'Dispatch record not found' }, { status: 404 })
    }

    // The dispatch must belong to the signed-in user.
    if (dispatch.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await tx(async (t) => {
      await q(
        `update dispatch_records set status = 'response_received', response_received_at = now() where id = $1`,
        [dispatchRecordId],
        t
      )
      await insert(
        'outcomes',
        {
          dispatch_record_id: dispatchRecordId,
          result,
          score_impact_points: Number.isFinite(Number(scoreImpactPoints)) ? Math.round(Number(scoreImpactPoints)) : null,
          notes: typeof notes === 'string' ? notes.slice(0, 2000) : null,
        },
        { on: t }
      )
      await update('dispute_items', { status: result }, { id: dispatch.dispute_item_id }, t)
    })

    if (dispatch.email) {
      sendOutcomeEmail(
        dispatch.email,
        dispatch.full_name ?? 'User',
        dispatch.account_name ?? 'Account',
        dispatch.bureau,
        result,
        dispatch.case_id
      ).catch(() => {})
    }

    const daysToResponse = daysSince(dispatch.sent_at)

    // Record to legacy intelligence table
    await insert('intelligence_records', {
      dispute_type: dispatch.item_type,
      bureau: dispatch.bureau,
      legal_basis: dispatch.legal_basis,
      round: dispatch.round ?? 1,
      result,
      days_to_response: daysToResponse,
    })

    // Feed outcome back to orchestrator learning agent (non-blocking)
    processOutcome({
      disputeType: dispatch.item_type as DisputeType,
      bureau: dispatch.bureau as Bureau,
      legalBasisUsed: dispatch.legal_basis ?? 'FCRA §611',
      strategySummary: dispatch.specialist_output?.strategy ?? dispatch.dispute_reason ?? '',
      letterTone: dispatch.specialist_output?.letterTone ?? 'firm',
      letterContent: dispatch.letter_content ?? '',
      outcome: result as OutcomeResult,
      daysToResponse: daysToResponse ?? 0,
      round: dispatch.round ?? 1,
      accountName: dispatch.account_name,
      amount: dispatch.amount ?? undefined,
    }).catch((err) => console.error('Learning agent error (non-fatal):', err))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Outcome tracker error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Check for expired 30-day windows and mark as no_response
export async function GET(request: NextRequest) {
  try {
    // Vercel cron sends CRON_SECRET as a Bearer token. Without it set, refuse:
    // otherwise anyone could trigger emails to every customer.
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Flip expired windows and record the outcome in one transaction, so a
    // second cron run can't double-count the same records.
    const ids = await tx(async (t) => {
      const expired = await q<{ id: string }>(
        `update dispatch_records set status = 'no_response'
          where status = 'sent' and response_due_at < now()
          returning id`,
        [],
        t
      )
      const list = expired.map((r) => r.id)
      if (list.length) {
        await q(
          `insert into outcomes (dispatch_record_id, result) select unnest($1::uuid[]), 'no_response'`,
          [list],
          t
        )
      }
      return list
    })

    if (ids.length > 0) {
      const records = await q<DispatchContext>(`${DISPATCH_CONTEXT_SQL} where dr.id = any($1::uuid[])`, [ids])
      const { sendNoResponseEmail } = await import('@/lib/email')

      for (const record of records) {
        processOutcome({
          disputeType: record.item_type as DisputeType,
          bureau: record.bureau as Bureau,
          legalBasisUsed: record.legal_basis ?? 'FCRA §611',
          strategySummary: record.specialist_output?.strategy ?? '',
          letterTone: record.specialist_output?.letterTone ?? 'firm',
          letterContent: record.letter_content ?? '',
          outcome: 'no_response',
          daysToResponse: daysSince(record.sent_at) ?? 0,
          round: record.round ?? 1,
          accountName: record.account_name,
          amount: record.amount ?? undefined,
        }).catch((err) => console.error('Learning agent (no_response) error:', err))

        if (record.email) {
          sendNoResponseEmail(
            record.email,
            record.full_name ?? 'User',
            record.account_name,
            record.bureau,
            record.case_id
          ).catch(() => {})
        }
      }
    }

    return NextResponse.json({ checked: ids.length })
  } catch (err) {
    console.error('Outcome tracker check error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
