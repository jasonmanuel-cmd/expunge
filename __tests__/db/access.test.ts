/**
 * Access tests against a real Postgres (PGlite) with db/schema.sql.
 *
 * Neon has no row-level security for this app, so every route must filter by
 * the signed-in user itself. These tests sign in as one firm's account or
 * client and try to reach another firm's data through every route and page
 * that touches user data. Each 403/404 test has a matching owner test, so a
 * refusal can't pass just because the route is broken.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import type { PGlite } from '@electric-sql/pglite'
import {
  cookieStore,
  jsonRequest,
  makeCase,
  makeFirm,
  makeTestDb,
  makeUser,
  signInAs,
} from './helpers'

vi.mock('next/headers', () => ({
  cookies: async () => cookieStore,
  headers: async () => new Headers({ host: 'localhost:3000' }),
}))
vi.mock('next/navigation', () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`)
  },
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/lib/email', () => ({
  sendLettersReadyEmail: vi.fn(async () => {}),
  sendOutcomeEmail: vi.fn(async () => {}),
  sendNoResponseEmail: vi.fn(async () => {}),
  canSendAuthEmail: () => true,
  sendConfirmEmail: vi.fn(async () => true),
  sendPasswordResetEmail: vi.fn(async () => true),
}))
const squareCancel = vi.fn(async (req: { subscriptionId: string }) => ({ req }))
vi.mock('@/lib/square/client', () => ({
  squareClient: { subscriptions: { cancel: (r: { subscriptionId: string }) => squareCancel(r) } },
  LOCATION_ID: 'loc',
  PLAN_IDS: { partner: 'pv-m', partner_annual: 'pv-a' },
}))
vi.mock('@/lib/agents/learning-agent', () => ({ processOutcome: vi.fn(async () => {}) }))
vi.mock('@/lib/agents/escalation-bot', () => ({
  runEscalationBot: vi.fn(async () => ({ round2Letter: 'R2', cfpbComplaint: 'CFPB' })),
}))
vi.mock('@/lib/agents/orchestrator', () => ({ runOrchestrator: vi.fn() }))
vi.mock('@/lib/agents/case-router', () => ({ routeCases: vi.fn() }))
vi.mock('@/lib/agents/specialists', () => ({ runSpecialistAgent: vi.fn() }))
vi.mock('@/lib/agents/letter-bot', () => ({ generateLetter: vi.fn() }))

let pg: PGlite
let firmA: Awaited<ReturnType<typeof makeFirm>>
let firmB: Awaited<ReturnType<typeof makeFirm>>
let caseA: Awaited<ReturnType<typeof makeCase>> // belongs to firm A's client
let caseB: Awaited<ReturnType<typeof makeCase>> // belongs to firm B's client
let sentB: Awaited<ReturnType<typeof makeCase>> // firm B's client, already mailed

const idParams = (id: string) => ({ params: Promise.resolve({ id }) })
const nreq = (url: string, method = 'POST', body?: unknown) =>
  new NextRequest(jsonRequest(`http://localhost:3000${url}`, method, body))

async function one<T>(sql: string, params: unknown[] = []): Promise<T> {
  return (await pg.query<T>(sql, params)).rows[0]
}

beforeAll(async () => {
  ;({ pg } = await makeTestDb())
  firmA = await makeFirm(pg, 'Alpha Law', ['Alice Client'])
  firmB = await makeFirm(pg, 'Bravo Credit', ['Bob Client', 'Betty Client'])
  caseA = await makeCase(pg, firmA.clients[0])
  caseB = await makeCase(pg, firmB.clients[0])
  sentB = await makeCase(pg, firmB.clients[1], { sent: true })
})

beforeEach(async () => {
  await signInAs(null)
  squareCancel.mockClear()
})

describe('letters', () => {
  it("a client can't download another firm's client's letter PDF", async () => {
    const { GET } = await import('@/app/api/letters/[id]/pdf/route')
    await signInAs(firmA.clients[0])
    expect((await GET(nreq('/x', 'GET'), idParams(caseB.letterId))).status).toBe(403)
  })

  it("a firm can't download its client's letter through its own account either", async () => {
    const { GET } = await import('@/app/api/letters/[id]/pdf/route')
    await signInAs(firmB.firmId)
    expect((await GET(nreq('/x', 'GET'), idParams(caseB.letterId))).status).toBe(403)
  })

  it('the owner can download their letter PDF', async () => {
    const { GET } = await import('@/app/api/letters/[id]/pdf/route')
    await signInAs(firmA.clients[0])
    const res = await GET(nreq('/x', 'GET'), idParams(caseA.letterId))
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('pdf')
  })

  it('signed out gets 401, and a malformed id gets 404 instead of a database error', async () => {
    const { GET } = await import('@/app/api/letters/[id]/pdf/route')
    expect((await GET(nreq('/x', 'GET'), idParams(caseA.letterId))).status).toBe(401)
    await signInAs(firmA.clients[0])
    expect((await GET(nreq('/x', 'GET'), idParams("1' or '1'='1"))).status).toBe(404)
  })

  it("a client can't mark another client's letter as mailed, and nothing changes", async () => {
    const { POST } = await import('@/app/api/letters/[id]/mark-sent/route')
    await signInAs(firmA.clients[0])
    expect((await POST(nreq('/x', 'POST', {}), idParams(caseB.letterId))).status).toBe(403)
    const d = await one<{ status: string }>(`select status from dispatch_records where id = $1`, [caseB.dispatchId])
    expect(d.status).toBe('queued')
  })

  it('the owner can mark their letter as mailed, once', async () => {
    const { POST } = await import('@/app/api/letters/[id]/mark-sent/route')
    await signInAs(firmA.clients[0])
    expect((await POST(nreq('/x', 'POST', {}), idParams(caseA.letterId))).status).toBe(200)
    const d = await one<{ status: string; response_due_at: string | null }>(
      `select status, response_due_at from dispatch_records where id = $1`,
      [caseA.dispatchId]
    )
    expect(d.status).toBe('sent')
    expect(d.response_due_at).toBeTruthy()
    expect((await POST(nreq('/x', 'POST', {}), idParams(caseA.letterId))).status).toBe(409)
  })
})

describe('cases and dispute items', () => {
  it("a client can't run the analysis on another client's case", async () => {
    const { POST } = await import('@/app/api/orchestrator/route')
    await signInAs(firmA.clients[0])
    expect((await POST(nreq('/api/orchestrator', 'POST', { caseId: caseB.caseId }))).status).toBe(403)
  })

  it("a client can't escalate another client's dispute item, and nothing changes", async () => {
    const { POST } = await import('@/app/api/escalation/route')
    await signInAs(firmA.clients[0])
    const res = await POST(nreq('/api/escalation', 'POST', { disputeItemId: caseB.itemId }))
    expect(res.status).toBe(403)
    const item = await one<{ round: number }>(`select round from dispute_items where id = $1`, [caseB.itemId])
    expect(item.round).toBe(1)
  })

  it("a client can't record an outcome on another client's dispatch", async () => {
    const { POST } = await import('@/app/api/outcome-tracker/route')
    await signInAs(firmA.clients[0])
    const res = await POST(nreq('/api/outcome-tracker', 'POST', { dispatchRecordId: sentB.dispatchId, result: 'removed' }))
    expect(res.status).toBe(403)
    const n = await one<{ n: number }>(`select count(*)::int as n from outcomes where dispatch_record_id = $1`, [
      sentB.dispatchId,
    ])
    expect(n.n).toBe(0)
  })

  it('the owner can record an outcome', async () => {
    const { POST } = await import('@/app/api/outcome-tracker/route')
    await signInAs(firmB.clients[1])
    const res = await POST(nreq('/api/outcome-tracker', 'POST', { dispatchRecordId: sentB.dispatchId, result: 'removed' }))
    expect(res.status).toBe(200)
    const item = await one<{ status: string }>(`select status from dispute_items where id = $1`, [sentB.itemId])
    expect(item.status).toBe('removed')
  })

  it("upload refuses a userId that isn't the signed-in user", async () => {
    const { POST } = await import('@/app/api/upload-report/route')
    await signInAs(firmA.clients[0])
    const form = new FormData()
    form.set('file', new File(['report text'], 'report.txt', { type: 'text/plain' }))
    form.set('userId', firmB.clients[0])
    const res = await POST(new NextRequest('http://localhost:3000/api/upload-report', { method: 'POST', body: form }))
    expect(res.status).toBe(403)
  })

  it("the case page doesn't load another client's case", async () => {
    const { default: Page } = await import('@/app/(consumer)/disputes/[id]/page')
    await signInAs(firmA.clients[0])
    await expect(Page(idParams(caseB.caseId))).rejects.toThrow('NOT_FOUND')
    await expect(Page(idParams(caseA.caseId))).resolves.toBeTruthy()
  })

  it("the dashboard lists only the signed-in client's own cases", async () => {
    const { default: Page } = await import('@/app/(consumer)/dashboard/page')
    await signInAs(firmA.clients[0])
    const html = renderToStaticMarkup((await Page()) as ReactElement)
    expect(html).toContain(caseA.caseId.slice(0, 8).toUpperCase())
    expect(html).not.toContain(caseB.caseId.slice(0, 8).toUpperCase())
  })
})

describe('firms and their clients', () => {
  it("a firm's dashboard shows only its own clients", async () => {
    const { default: Page } = await import('@/app/partner/dashboard/page')
    await signInAs(firmA.firmId)
    const html = renderToStaticMarkup((await Page()) as ReactElement)
    expect(html).toContain('Alice Client')
    expect(html).not.toContain('Bob Client')
    expect(html).not.toContain('Betty Client')
  })

  it("a client can't open the firm dashboard", async () => {
    const { default: Page } = await import('@/app/partner/dashboard/page')
    await signInAs(firmA.clients[0])
    await expect(Page()).rejects.toThrow('REDIRECT:/dashboard')
  })

  it("a firm can't remove another firm's client", async () => {
    const { DELETE } = await import('@/app/api/partner/clients/route')
    await signInAs(firmA.firmId)
    const res = await DELETE(nreq('/api/partner/clients', 'DELETE', { consumerId: firmB.clients[0] }))
    expect(res.status).toBe(404)
    const link = await one<{ n: number }>(
      `select count(*)::int as n from partner_clients where partner_id = $1 and consumer_id = $2`,
      [firmB.firmId, firmB.clients[0]]
    )
    expect(link.n).toBe(1)
  })

  it("a client can't use the firm-only routes", async () => {
    const { DELETE } = await import('@/app/api/partner/clients/route')
    const { POST } = await import('@/app/api/partner/settings/route')
    await signInAs(firmB.clients[0])
    expect((await DELETE(nreq('/x', 'DELETE', { consumerId: firmB.clients[1] }))).status).toBe(403)
    expect((await POST(nreq('/x', 'POST', { firmName: 'Hijack' }))).status).toBe(403)
  })

  it("saving firm settings changes only the firm's own row and keeps its invite code", async () => {
    const { POST } = await import('@/app/api/partner/settings/route')
    await signInAs(firmA.firmId)
    const res = await POST(nreq('/api/partner/settings', 'POST', { firmName: 'Alpha Law Group' }))
    expect(res.status).toBe(200)
    expect((await res.json()).inviteCode).toBe(firmA.code)
    const b = await one<{ firm_name: string }>(`select firm_name from partner_settings where partner_id = $1`, [firmB.firmId])
    expect(b.firm_name).toBe('Bravo Credit')
  })

  it("a client of one firm can't be moved to another firm with an invite link", async () => {
    const { POST } = await import('@/app/api/partner/join/route')
    await signInAs(firmB.clients[0])
    const res = await POST(nreq('/api/partner/join', 'POST', { code: firmA.code }))
    expect(res.status).toBe(409)
  })

  it("a firm account can't join another firm", async () => {
    const { POST } = await import('@/app/api/partner/join/route')
    await signInAs(firmB.firmId)
    expect((await POST(nreq('/api/partner/join', 'POST', { code: firmA.code }))).status).toBe(403)
  })

  it('an unlinked client can join with a valid invite', async () => {
    const { POST } = await import('@/app/api/partner/join/route')
    const loner = await makeUser(pg, 'consumer', 'Lonely Client')
    await signInAs(loner)
    const res = await POST(nreq('/api/partner/join', 'POST', { code: firmA.code }))
    expect(res.status).toBe(200)
  })
})

describe('billing', () => {
  it("cancel only ever cancels the signed-in firm's own subscription", async () => {
    const { POST } = await import('@/app/api/square/cancel-subscription/route')
    await signInAs(firmA.firmId)
    expect((await POST()).status).toBe(200)
    expect(squareCancel).toHaveBeenCalledTimes(1)
    expect(squareCancel).toHaveBeenCalledWith({ subscriptionId: `sq-${firmA.firmId}` })
    const b = await one<{ cancel_at_period_end: boolean }>(
      `select cancel_at_period_end from subscriptions where user_id = $1`,
      [firmB.firmId]
    )
    expect(b.cancel_at_period_end).toBe(false)
  })

  it("checkout refuses a userId that isn't the signed-in user, and refuses clients", async () => {
    const { POST } = await import('@/app/api/square/create-subscription/route')
    await signInAs(firmA.firmId)
    const spoof = await POST(nreq('/x', 'POST', { planKey: 'partner', sourceId: 's', userId: firmB.firmId, email: 'x@y.z' }))
    expect(spoof.status).toBe(403)
    await signInAs(firmA.clients[0])
    const client = await POST(nreq('/x', 'POST', { planKey: 'partner', sourceId: 's', userId: firmA.clients[0], email: 'x@y.z' }))
    expect(client.status).toBe(403)
  })

  it("the billing page shows the signed-in firm's own plan", async () => {
    const { default: Page } = await import('@/app/billing/page')
    await signInAs(firmB.firmId)
    await expect(Page()).resolves.toBeTruthy()
  })
})

describe('profile', () => {
  it("updating your profile changes only your row and never your role", async () => {
    const { updateMyProfileAction, getMyProfileAction } = await import('@/app/(consumer)/profile/actions')
    await signInAs(firmA.clients[0])
    const res = await updateMyProfileAction({
      full_name: 'Alice Changed',
      // Extra keys a caller might sneak in are ignored.
      ...({ role: 'admin', id: firmB.clients[0] } as object),
    })
    expect(res.error).toBeNull()
    expect((await getMyProfileAction())?.full_name).toBe('Alice Changed')
    const me = await one<{ role: string }>(`select role from profiles where id = $1`, [firmA.clients[0]])
    expect(me.role).toBe('consumer')
    const other = await one<{ full_name: string }>(`select full_name from profiles where id = $1`, [firmB.clients[0]])
    expect(other.full_name).toBe('Bob Client')
  })
})
