import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { insert, q1, update } from '@/lib/db'
import { isUuid } from '@/lib/ids'
import { runEscalationBot } from '@/lib/agents/escalation-bot'
import { assertPlanLimit } from '@/lib/square/subscription'
import type { OrchestratorItem } from '@/lib/types'

interface ItemRow {
  id: string
  case_id: string
  type: OrchestratorItem['type']
  account_name: string
  account_number: string | null
  bureau: OrchestratorItem['bureau']
  amount: number | null
  dispute_reason: string | null
  legal_basis: string | null
  status: string
  round: number | null
  owner_id: string
  full_name: string | null
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const gate = await assertPlanLimit(user.id, 'escalation')
    if (!gate.allowed) {
      return NextResponse.json({ error: gate.reason, upgradeTo: gate.upgradeTo }, { status: 402 })
    }

    const { disputeItemId } = await req.json()

    const item = isUuid(disputeItemId)
      ? await q1<ItemRow>(
          `select di.*, c.user_id as owner_id, p.full_name
             from dispute_items di
             join cases c on c.id = di.case_id
             left join profiles p on p.id = c.user_id
            where di.id = $1`,
          [disputeItemId]
        )
      : null

    if (!item) {
      return NextResponse.json({ error: 'Dispute item not found' }, { status: 404 })
    }

    // The case must belong to the signed-in user.
    if (item.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Original mailing date for THIS item only (earliest letter the consumer marked as mailed).
    const dispatch = await q1<{ sent_at: string }>(
      `select dr.sent_at
         from dispatch_records dr
         join letters l on l.id = dr.letter_id
        where l.dispute_item_id = $1 and dr.sent_at is not null
        order by dr.sent_at asc
        limit 1`,
      [disputeItemId]
    )

    const orchestratorItem: OrchestratorItem = {
      type: item.type,
      accountName: item.account_name,
      accountNumber: item.account_number ?? undefined,
      bureau: item.bureau,
      amount: item.amount ?? undefined,
      disputeReason: item.dispute_reason ?? '',
      legalBasis: item.legal_basis ?? '',
      priority: 10,
    } as OrchestratorItem

    const consumerName = item.full_name || 'Consumer'
    const originalDate = dispatch?.sent_at
      ? new Date(dispatch.sent_at).toLocaleDateString()
      : 'Unknown'
    const newRound = (item.round || 1) + 1

    const { round2Letter, cfpbComplaint } = await runEscalationBot(
      orchestratorItem,
      consumerName,
      originalDate,
      item.status === 'verified'
        ? 'Bureau verified the item without a reasonable investigation'
        : 'No response received within 30-day window',
      newRound
    )

    await update('dispute_items', { round: newRound, status: 'letter_drafted' }, { id: disputeItemId })

    const [r2Letter] = await insert<{ id: string }>('letters', {
      dispute_item_id: disputeItemId,
      bureau: item.bureau,
      content: round2Letter,
      round: newRound,
    })

    await insert('letters', {
      dispute_item_id: disputeItemId,
      bureau: item.bureau,
      content: cfpbComplaint,
      round: newRound,
      is_cfpb_complaint: true,
    })

    if (r2Letter) {
      // Queued until the consumer marks the round-2 letter as mailed.
      await insert('dispatch_records', { letter_id: r2Letter.id, bureau: item.bureau, status: 'queued' })
    }

    await update('cases', { status: 'escalated' }, { id: item.case_id })

    return NextResponse.json({ success: true, round: newRound })
  } catch (err) {
    console.error('Escalation error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
