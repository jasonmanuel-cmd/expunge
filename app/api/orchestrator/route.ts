import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { runOrchestrator } from '@/lib/agents/orchestrator'
import { routeCases } from '@/lib/agents/case-router'
import { runSpecialistAgent } from '@/lib/agents/specialists'
import { generateLetter } from '@/lib/agents/letter-bot'
import { sendLettersReadyEmail } from '@/lib/email'
import type { Bureau } from '@/lib/types'

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
  try {
    const body = await req.json()
    const { caseId, userId: bodyUserId } = body

    // Rate limit check
    const supabase = createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
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
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*, profiles(full_name, email, address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth)')
      .eq('id', caseId)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // If bodyUserId provided, verify it matches the case owner
    if (bodyUserId && bodyUserId !== caseData.user_id) {
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

    await supabase.from('cases').update({ status: 'analyzing' }).eq('id', caseId)

    // Step 1: Master Orchestrator
    const orchestratorOutput = await runOrchestrator(caseData.credit_report_text)
    await supabase
      .from('cases')
      .update({ orchestrator_output: orchestratorOutput, status: 'routing' })
      .eq('id', caseId)

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

    const { data: insertedItems } = await supabase
      .from('dispute_items')
      .insert(disputeItemsToInsert)
      .select()

    await supabase.from('cases').update({ status: 'active' }).eq('id', caseId)

    if (!insertedItems) {
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

    // Step 4: Run specialist agents + generate letters (sorted by processing order)
    const sortedRouted = [...routedItems].sort((a, b) => a.processingOrder - b.processingOrder)

    for (const routed of sortedRouted) {
      const item = orchestratorOutput.items[routed.itemIndex]
      const dbItem = insertedItems[routed.itemIndex]
      if (!dbItem) continue

      const specialistOutput = await runSpecialistAgent(item, consumerName)
      await supabase
        .from('dispute_items')
        .update({ specialist_output: specialistOutput, status: 'letter_drafted' })
        .eq('id', dbItem.id)

      const bureaus: Bureau[] =
        item.bureau === 'all'
          ? ['equifax', 'experian', 'transunion']
          : [item.bureau as Bureau]

      for (const bureau of bureaus) {
        const letterContent = await generateLetter(item, specialistOutput, consumer, bureau, 1)

        const { data: letter } = await supabase
          .from('letters')
          .insert({ dispute_item_id: dbItem.id, bureau, content: letterContent, round: 1 })
          .select()
          .single()

        if (letter) {
          const sentAt = new Date()
          const responseDueAt = new Date(sentAt)
          responseDueAt.setDate(responseDueAt.getDate() + 30)

          await supabase.from('dispatch_records').insert({
            letter_id: letter.id,
            bureau,
            tracking_number: `EX-${Date.now()}-${bureau.slice(0, 3).toUpperCase()}`,
            status: 'sent',
            sent_at: sentAt.toISOString(),
            response_due_at: responseDueAt.toISOString(),
          })
        }
      }

      await supabase
        .from('dispute_items')
        .update({ status: 'dispatched' })
        .eq('id', dbItem.id)
    }

    await supabase.from('cases').update({ status: 'monitoring' }).eq('id', caseId)

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

    return NextResponse.json({ success: true, itemCount: orchestratorOutput.totalDisputableItems })
  } catch (err) {
    console.error('Orchestrator error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
