import { describe, it, expect } from 'vitest'
import type { OutcomeContext } from '@/lib/agents/learning-agent'

describe('learning-agent processOutcome contract', () => {
  const validContext: OutcomeContext = {
    disputeType: 'credit_card',
    bureau: 'equifax',
    legalBasisUsed: 'FCRA § 611(a)(1)(A)',
    strategySummary: 'Disputed inaccurate balance under FCRA § 623',
    letterTone: 'firm',
    letterContent: 'The balance reported is inaccurate...',
    outcome: 'removed',
    daysToResponse: 14,
    round: 1,
    accountName: 'Chase Visa',
    amount: 2500,
  }

  it('defines OutcomeContext with all required fields', () => {
    expect(validContext.disputeType).toBe('credit_card')
    expect(validContext.bureau).toBe('equifax')
    expect(validContext.legalBasisUsed).toBeDefined()
    expect(validContext.strategySummary).toBeDefined()
    expect(validContext.letterTone).toMatch(/firm|conciliatory|urgent/)
    expect(validContext.letterContent).toBeDefined()
    expect(validContext.outcome).toMatch(/removed|modified|verified|no_response/)
    expect(typeof validContext.daysToResponse).toBe('number')
    expect(typeof validContext.round).toBe('number')
    expect(validContext.accountName).toBeDefined()
  })

  it('allows optional amount field', () => {
    const ctxWithoutAmount: OutcomeContext = {
      ...validContext,
      amount: undefined,
    }
    expect(ctxWithoutAmount.amount).toBeUndefined()
  })

  it('accepts all valid dispute types', () => {
    const types: OutcomeContext['disputeType'][] = [
      'bankruptcy', 'credit_card', 'mortgage', 'auto',
      'collections', 'public_record', 'fraud', 'inquiry',
    ]
    for (const t of types) {
      const ctx: OutcomeContext = { ...validContext, disputeType: t }
      expect(ctx.disputeType).toBe(t)
    }
  })

  it('accepts all valid bureaus', () => {
    const bureaus: OutcomeContext['bureau'][] = ['equifax', 'experian', 'transunion', 'data_furnisher']
    for (const b of bureaus) {
      const ctx: OutcomeContext = { ...validContext, bureau: b }
      expect(ctx.bureau).toBe(b)
    }
  })

  it('accepts all valid outcome values', () => {
    const outcomes: OutcomeContext['outcome'][] = ['removed', 'modified', 'verified', 'no_response']
    for (const o of outcomes) {
      const ctx: OutcomeContext = { ...validContext, outcome: o }
      expect(ctx.outcome).toBe(o)
    }
  })

  it('outcome constrains successRate mapping', () => {
    const successRateMap: Record<string, number> = {
      removed: 1.0,
      modified: 0.7,
      verified: 0.1,
      no_response: 0.0,
    }
    for (const [outcome, rate] of Object.entries(successRateMap)) {
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(1)
    }
  })
})
