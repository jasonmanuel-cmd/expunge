import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { insert, q1, update } from '@/lib/db'
import { isUuid } from '@/lib/ids'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { routeCases } from '@/lib/agents/case-router'
import { runSpecialistAgent } from '@/lib/agents/specialists'
import { generateLetter } from '@/lib/agents/letter-bot'
import { sendLettersReadyEmail } from '@/lib/email'
import { getUserPlan, SEAT_LIMITED } from '@/lib/square/subscription'
import type { Bureau } from '@/lib/types'

// The full pipeline makes many sequential AI calls (orchestrator +
// per-item specialist + per-bureau letters), so allow up to 5 minutes.
export const maxDuration = 300

// Simple in-memory rate limit (resets on deploy — use Redis for production)
const RATE_LIMIT_WINDOW = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5 // max requests per window per user
const rateMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  // Set once the case is confirmed to belong to the user, so a failure can
  // mark it 'failed' instead of leaving it stuck on 'analyzing'.
  let ownedCaseId: string | null = null
  try {
    const body = await req.json()
    const { caseId } = body

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 })
    }

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 })
    }

    // Fetch the case and verify ownership
    const caseData = isUuid(caseId)
      ? await q1<{
          user_id: string
          credit_report_text: string | null
          profiles: {
            full_name: string | null
            email: string | null
            address_line1: string | null
            address_line2: string | null
            city: string | null
            state: string | null
            zip_code: string | null
            ssn_last4: string | null
            date_of_birth: string | null
          } | null
        }>(
          `select c.user_id, c.credit_report_text,
                  (select to_jsonb(x) from (
                     select p.full_name, p.email, p.address_line1, p.address_line2, p.city,
                            p.state, p.zip_code, p.ssn_last4, p.date_of_birth::text as date_of_birth
                       from profiles p where p.id = c.user_id
                  ) x) as profiles
             from cases c
            where c.id = $1`,
          [caseId]
        )
      : null

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Ownership: the authenticated user must own this case.
    if (caseData.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!caseData.credit_report_text) {
      return NextResponse.json({ error: 'No credit report text found' }, { status: 400 })
    }

    // Check that the user has completed their profile (address and DOB are required)
    const profile = caseData.profiles
    if (!profile?.address_line1 || !profile?.city || !profile?.state || !profile?.zip_code || !profile?.ssn_last4 || !profile?.date_of_birth) {
      return NextResponse.json(
        {
          error: 'Please complete your profile before uploading a credit report',
          profile_completion_url: '/consumer/profile/step2',
          code: 'PROFILE_INCOMPLETE',
        },
        { status: 400 }
      )
    }

    // Expunge is only available through a firm plan; there is no consumer tier.
    const plan = await getUserPlan(user.id)
    if (!plan.isActive) {
      return NextResponse.json(
        plan.seatLimited
          ? { error: SEAT_LIMITED, code: 'SEAT_LIMIT' }
          : { error: 'Your account isn\'t covered by a firm plan right now. Ask the firm that invited you.', code: 'NOT_COVERED' },
        { status: 402 }
      )
    }

    ownedCaseId = caseId
    await update('cases', { status: 'analyzing' }, { id: caseId })

    // Step 1: Master Orchestrator
    const orchestratorOutput = await runOrchestrator(caseData.credit_report_text)

    // Plan limit: keep the highest-priority items up to the plan's per-case cap.
    const foundItemCount = orchestratorOutput.items.length
    if (foundItemCount > plan.maxItems) {
      orchestratorOutput.items = [...orchestratorOutput.items]
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        .slice(0, plan.maxItems)
    }
    orchestratorOutput.totalDisputableItems = orchestratorOutput.items.length
    const itemsOverLimit = foundItemCount - orchestratorOutput.items.length
    await update('cases', { orchestrator_output: orchestratorOutput, status: 'routing' }, { id: caseId })

    // Step 2: Case Router
    const routedItems = await routeCases(orchestratorOutput.items)

    // Step 3: Insert dispute items
    const disputeItemsToInsert = orchestratorOutput.items.map((item) => ({
      case_id: caseId,
      type: item.type,
      account_name: item.accountName,
      account_number: item.accountNumber,
      bureau: item.bureau,
      amount: item.amount,
      dispute_reason: item.disputeReason,
      legal_basis: item.legalBasis,
      status: 'pending',
      round: 1,
    }))

    // Insert in one statement and keep the input order (ids are matched by index below).
    const insertedItems = disputeItemsToInsert.length
      ? await insert<{ id: string }>('dispute_items', disputeItemsToInsert)
      : []

    await update('cases', { status: 'active' }, { id: caseId })

    if (insertedItems.length !== disputeItemsToInsert.length) {
      return NextResponse.json({ error: 'Failed to insert dispute items' }, { status: 500 })
    }

    // Build full consumer data from profile
    const consumerName = profile?.full_name || 'Consumer'

    const addressParts = [
      profile.address_line1,
      profile.address_line2,
      profile.city,
      `${profile.state} ${profile.zip_code}`,
    ].filter(Boolean)
    const fullAddress = addressParts.join(', ')

    // Format DOB as MM/DD/YYYY
    const dobDate = new Date(profile.date_of_birth!)
    const formattedDob = `${String(dobDate.getMonth() + 1).padStart(2, '0')}/${String(dobDate.getDate()).padStart(2, '0')}/${dobDate.getFullYear()}`

    const consumer = {
      name: consumerName,
      address: fullAddress,
      ssn_last4: profile.ssn_last4 || '',
      dob: formattedDob,
    }

    // Step 4: Run specialist agents + generate letters.
    // Each item (specialist + its bureau letters) runs concurrently, and the
    // bureau letters within an item run concurrently too — so total time is
    // ~the slowest single item rather than the sum of every AI call. This
    // keeps the whole pipeline well under the function timeout.
    await Promise.all(
      routedItems.map(async (routed) => {
        const item = orchestratorOutput.items[routed.itemIndex]
        const dbItem = insertedItems[routed.itemIndex]
        if (!item || !dbItem) return

        const specialistOutput = await runSpecialistAgent(item, consumerName)
        await update('dispute_items', { specialist_output: specialistOutput, status: 'letter_drafted' }, { id: dbItem.id })

        // Single-bureau plans get one letter per item; tri-bureau plans get all three.
        const bureaus: Bureau[] =
          item.bureau === 'all'
            ? plan.triBureau
              ? ['equifax', 'experian', 'transunion']
              : ['equifax']
            : [item.bureau as Bureau]

        await Promise.all(
          bureaus.map(async (bureau) => {
            const letterContent = await generateLetter(item, specialistOutput, consumer, bureau, 1)

            const [letter] = await insert<{ id: string }>('letters', {
              dispute_item_id: dbItem.id,
              bureau,
              content: letterContent,
              round: 1,
            })

            if (letter) {
              // Expunge does not mail letters. The record waits as 'queued' until
              // the consumer marks the letter as mailed (POST /api/letters/[id]/mark-sent),
              // which starts the 30-day response window.
              await insert('dispatch_records', { letter_id: letter.id, bureau, status: 'queued' })
            }
          })
        )

      })
    )

    await update('cases', { status: 'active' }, { id: caseId })

    // Send email notification
    const userEmail = profile?.email
    if (userEmail) {
      sendLettersReadyEmail(
        userEmail,
        consumerName,
        caseId,
        orchestratorOutput.totalDisputableItems
      ).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      itemCount: orchestratorOutput.totalDisputableItems,
      itemsOverLimit,
      plan: plan.plan,
    })
  } catch (err) {
    console.error('Orchestrator error:', err)
    if (ownedCaseId) {
      await update('cases', { status: 'failed' }, { id: ownedCaseId }).catch(() => {})
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
