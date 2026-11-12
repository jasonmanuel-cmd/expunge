/**
 * Database flows that used to rely on Supabase behaviour.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'
import type { PGlite } from '@electric-sql/pglite'
import { makeCase, makeFirm, makeTestDb } from './helpers'

vi.mock('@/lib/email', () => ({
  sendNoResponseEmail: vi.fn(async () => {}),
  sendOutcomeEmail: vi.fn(async () => {}),
}))
vi.mock('@/lib/ai', () => ({
  runAgent: vi.fn(async () => JSON.stringify({ insight: 'x', confidenceScore: 0.8, successRate: 1, keyFactor: 'k', recommendedAdjustment: 'r' })),
}))

let pg: PGlite
beforeAll(async () => {
  ;({ pg } = await makeTestDb())
  process.env.CRON_SECRET = 'test-cron'
})

describe('outcome cron', () => {
  it('marks expired windows once, even when it runs twice', async () => {
    const firm = await makeFirm(pg, 'Cron Firm', ['Cron Client'])
    const c = await makeCase(pg, firm.clients[0], { sent: true })
    const { GET } = await import('@/app/api/outcome-tracker/route')
    const req = () => new NextRequest('http://localhost/api/outcome-tracker', { headers: { authorization: 'Bearer test-cron' } })
    expect(await (await GET(req())).json()).toEqual({ checked: 1 })
    expect(await (await GET(req())).json()).toEqual({ checked: 0 })
    const rows = await pg.query<{ result: string }>(`select result from outcomes where dispatch_record_id = $1`, [c.dispatchId])
    expect(rows.rows).toEqual([{ result: 'no_response' }])
  })

  it('refuses without the cron secret', async () => {
    const { GET } = await import('@/app/api/outcome-tracker/route')
    expect((await GET(new NextRequest('http://localhost/api/outcome-tracker'))).status).toBe(401)
  })
})

describe('firm seats', () => {
  it("counts a client's seat by link order, to the microsecond", async () => {
    const { getSponsoringFirm, getFirmSeats } = await import('@/lib/partner/server')
    const firm = await makeFirm(pg, 'Seat Firm', ['S1', 'S2', 'S3'])
    await pg.query(`update subscriptions set client_seats = 2 where user_id = $1`, [firm.firmId])
    // Two links in the same millisecond: order must still hold.
    await pg.query(
      `update partner_clients set created_at = '2026-01-01T00:00:00.000100Z' where consumer_id = $1;`,
      [firm.clients[0]]
    )
    await pg.query(`update partner_clients set created_at = '2026-01-01T00:00:00.000200Z' where consumer_id = $1`, [firm.clients[1]])
    await pg.query(`update partner_clients set created_at = '2026-01-01T00:00:00.000300Z' where consumer_id = $1`, [firm.clients[2]])
    const seats = await getFirmSeats(firm.firmId)
    expect(seats.full).toBe(true)
    const s2 = await getSponsoringFirm(firm.clients[1])
    const s3 = await getSponsoringFirm(firm.clients[2])
    expect(s2?.seated).toBe(true)
    expect(s3?.seated).toBe(false)
  })
})

describe('learning agent memory', () => {
  it('adds to one pattern row instead of making duplicates, with the running averages', async () => {
    const { processOutcome } = await import('@/lib/agents/learning-agent')
    const ctx = {
      disputeType: 'collections' as const,
      bureau: 'equifax' as const,
      legalBasisUsed: 'FCRA 611',
      strategySummary: 's',
      letterTone: 'firm',
      letterContent: 'c',
      outcome: 'removed' as const,
      round: 1,
      accountName: 'ACME',
    }
    await Promise.all([processOutcome({ ...ctx, daysToResponse: 10 }), processOutcome({ ...ctx, daysToResponse: 20 })])
    const rows = await pg.query<{ sample_count: number; avg_days_to_response: number; success_rate: number }>(
      `select sample_count, avg_days_to_response, success_rate from orchestrator_memory where dispute_type = 'collections' and outcome = 'removed'`
    )
    expect(rows.rows.length).toBe(1)
    expect(rows.rows[0].sample_count).toBe(2)
    expect(rows.rows[0].avg_days_to_response).toBe(15)
    expect(rows.rows[0].success_rate).toBe(1)
  })
})
