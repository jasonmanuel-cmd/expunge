import { runAgent } from '@/lib/ai'
import { q } from '@/lib/db'
import type { DisputeType, Bureau, OutcomeResult } from '@/lib/types'

export interface OutcomeContext {
  disputeType: DisputeType
  bureau: Bureau
  legalBasisUsed: string
  strategySummary: string
  letterTone: string
  letterContent: string
  outcome: OutcomeResult
  daysToResponse: number
  round: number
  accountName: string
  amount?: number
}

const SYSTEM_PROMPT = `You are the Intelligence Layer for Expunge — the learning brain of the system.
Your job is to analyze the outcome of a completed credit dispute and extract actionable insights that will make future disputes stronger.

You receive the full context of a dispute: what was disputed, which legal basis was used, what strategy was employed, what the bureau response was, and how long it took.

Extract a structured insight that captures:
1. WHY this outcome occurred (what worked or didn't work)
2. What should be done differently next time for this dispute type + bureau combination
3. How confident we should be in this strategy going forward
4. Any patterns worth noting (timing, tone, legal citation effectiveness)

Respond with valid JSON:
{
  "insight": "<1-3 sentence actionable learning for future disputes>",
  "strategyEffective": <true|false>,
  "confidenceScore": <0.0-1.0, based on outcome strength>,
  "successRate": <0.0-1.0, 1.0 for removed, 0.7 for modified, 0.1 for verified, 0.0 for no_response>,
  "keyFactor": "<the single most important factor that influenced this outcome>",
  "recommendedAdjustment": "<specific change to make for next similar dispute>"
}`

interface LearningOutput {
  insight: string
  strategyEffective: boolean
  confidenceScore: number
  successRate: number
  keyFactor: string
  recommendedAdjustment: string
}

export async function processOutcome(ctx: OutcomeContext): Promise<void> {
  const userMessage = `Analyze this completed dispute outcome:

DISPUTE DETAILS:
- Account: ${ctx.accountName}${ctx.amount ? ` ($${ctx.amount.toLocaleString()})` : ''}
- Type: ${ctx.disputeType}
- Bureau: ${ctx.bureau}
- Round: ${ctx.round}
- Legal basis used: ${ctx.legalBasisUsed}
- Letter tone: ${ctx.letterTone}
- Strategy summary: ${ctx.strategySummary}
- Days to response: ${ctx.daysToResponse}

OUTCOME: ${ctx.outcome.toUpperCase()}

LETTER EXCERPT (first 800 chars):
${ctx.letterContent.slice(0, 800)}

Extract the learning insight for this outcome.`

  let learning: LearningOutput
  try {
    const response = await runAgent(SYSTEM_PROMPT, userMessage)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in learning response')
    learning = JSON.parse(jsonMatch[0]) as LearningOutput
  } catch {
    // Fallback learning if parsing fails
    learning = {
      insight: `${ctx.disputeType} dispute at ${ctx.bureau} with ${ctx.legalBasisUsed} resulted in ${ctx.outcome} after ${ctx.daysToResponse} days.`,
      strategyEffective: ctx.outcome === 'removed' || ctx.outcome === 'modified',
      confidenceScore: ctx.outcome === 'removed' ? 0.8 : ctx.outcome === 'modified' ? 0.6 : 0.3,
      successRate: ctx.outcome === 'removed' ? 1.0 : ctx.outcome === 'modified' ? 0.7 : ctx.outcome === 'verified' ? 0.1 : 0.0,
      keyFactor: ctx.legalBasisUsed,
      recommendedAdjustment: ctx.outcome === 'no_response' ? 'Escalate to Round 2 immediately' : 'Continue with current approach',
    }
  }

  // Upsert into orchestrator_memory in one statement (keyed by the table's
  // unique pattern), so two outcomes landing at once can't create duplicates
  // or lose a sample. Same running-average math as before.
  await q(
    `insert into orchestrator_memory
       (dispute_type, bureau, legal_basis_used, strategy_summary, letter_tone, outcome,
        avg_days_to_response, round, insight, confidence_score, success_rate, sample_count)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)
     on conflict (dispute_type, bureau, legal_basis_used, outcome, round) do update set
       insight = excluded.insight,
       confidence_score = least(0.95, coalesce(orchestrator_memory.confidence_score, 0.5) * 0.7 + excluded.confidence_score * 0.3),
       success_rate = (coalesce(orchestrator_memory.success_rate, 0) * coalesce(orchestrator_memory.sample_count, 1) + excluded.success_rate)
                      / (coalesce(orchestrator_memory.sample_count, 1) + 1),
       avg_days_to_response = (coalesce(orchestrator_memory.avg_days_to_response, excluded.avg_days_to_response) * coalesce(orchestrator_memory.sample_count, 1)
                               + excluded.avg_days_to_response)
                              / (coalesce(orchestrator_memory.sample_count, 1) + 1),
       sample_count = coalesce(orchestrator_memory.sample_count, 1) + 1,
       strategy_summary = excluded.strategy_summary,
       letter_tone = excluded.letter_tone,
       last_updated = now()`,
    [
      ctx.disputeType,
      ctx.bureau,
      ctx.legalBasisUsed,
      ctx.strategySummary,
      ctx.letterTone,
      ctx.outcome,
      ctx.daysToResponse,
      ctx.round,
      learning.insight,
      Math.min(1, Math.max(0, learning.confidenceScore)),
      Math.min(1, Math.max(0, learning.successRate)),
    ]
  )
}
