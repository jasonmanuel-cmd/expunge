import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PGlite } from '@electric-sql/pglite'
import { pgTimestampToIso, setDatabaseForTests, type Database, type Querier, type Row } from '@/lib/db'
import { createSessionToken } from '@/lib/auth'

/**
 * An in-memory Postgres (PGlite) loaded with db/schema.sql, returning values
 * the same way lib/db.ts does against Neon.
 */
const parsers = {
  1184: pgTimestampToIso, // timestamptz
  1114: (v: string) => pgTimestampToIso(v + '+00'), // timestamp
  1082: (v: string) => v, // date
  1700: (v: string) => Number(v), // numeric
  20: (v: string) => Number(v), // int8
}

export async function makeTestDb(): Promise<{ pg: PGlite; db: Database }> {
  const pg = new PGlite({ parsers })
  await pg.exec(readFileSync(path.join(__dirname, '../../db/schema.sql'), 'utf8'))
  const wrap = (runner: { query: PGlite['query'] }): Querier => ({
    async query<T extends Row = Row>(text: string, params: unknown[] = []) {
      const res = await runner.query<T>(text, params as unknown[])
      return { rows: res.rows }
    },
  })
  const db: Database = {
    ...wrap(pg),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))),
  }
  setDatabaseForTests(db)
  return { pg, db }
}

/** Cookie jar that next/headers' cookies() is mocked to return. */
export const cookieJar = new Map<string, string>()
export const cookieStore = {
  get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
  set: (name: string, value: string) => void cookieJar.set(name, value),
  delete: (name: string) => void cookieJar.delete(name),
}

/** Sign in as this user for the next calls (sets the session cookie). */
export async function signInAs(userId: string | null) {
  cookieJar.clear()
  if (userId) cookieJar.set('expunge_session', await createSessionToken(userId))
}

let n = 0
export async function makeUser(
  db: Querier,
  role: 'consumer' | 'partner' | 'admin',
  name: string
): Promise<string> {
  n++
  const email = `${name.toLowerCase().replace(/\W+/g, '')}${n}@example.com`
  const { rows } = await db.query<{ id: string }>(
    `insert into users (email, password_hash, email_confirmed_at) values ($1, '$2a$04$x', now()) returning id`,
    [email]
  )
  const id = rows[0].id
  await db.query(
    `insert into profiles (id, email, full_name, role, address_line1, city, state, zip_code, ssn_last4, date_of_birth)
     values ($1, $2, $3, $4, '1 Main St', 'Bakersfield', 'CA', '93301', '1234', '1980-01-02')`,
    [id, email, name, role]
  )
  return id
}

/** A firm with an active paid plan, its invite code, and linked clients. */
export async function makeFirm(db: Querier, name: string, clientNames: string[]) {
  const firmId = await makeUser(db, 'partner', name)
  const code = `${name.toLowerCase().replace(/\W+/g, '')}code1234`.slice(0, 32)
  await db.query(`insert into partner_settings (partner_id, firm_name, invite_code) values ($1, $2, $3)`, [
    firmId,
    name,
    code,
  ])
  await db.query(
    `update subscriptions set plan = 'partner', status = 'active', square_subscription_id = $2, client_seats = 25,
            current_period_end = now() + interval '30 days'
      where user_id = $1`,
    [firmId, `sq-${firmId}`]
  )
  const clients: string[] = []
  for (const c of clientNames) {
    const id = await makeUser(db, 'consumer', c)
    await db.query(`insert into partner_clients (partner_id, consumer_id) values ($1, $2)`, [firmId, id])
    clients.push(id)
  }
  return { firmId, code, clients }
}

/** A case with one dispute item, one letter, and its dispatch record. */
export async function makeCase(db: Querier, userId: string, opts: { sent?: boolean } = {}) {
  const c = await db.query<{ id: string }>(
    `insert into cases (user_id, status, credit_report_text) values ($1, 'active', 'REPORT TEXT') returning id`,
    [userId]
  )
  const caseId = c.rows[0].id
  const di = await db.query<{ id: string }>(
    `insert into dispute_items (case_id, type, account_name, bureau, status, dispute_reason, legal_basis)
     values ($1, 'collections', 'ACME COLLECTIONS', 'equifax', 'letter_drafted', 'Not mine', 'FCRA 611') returning id`,
    [caseId]
  )
  const itemId = di.rows[0].id
  const l = await db.query<{ id: string }>(
    `insert into letters (dispute_item_id, bureau, content, round) values ($1, 'equifax', 'Dear Equifax, please investigate.', 1) returning id`,
    [itemId]
  )
  const letterId = l.rows[0].id
  const d = await db.query<{ id: string }>(
    opts.sent
      ? `insert into dispatch_records (letter_id, bureau, status, sent_at, response_due_at)
         values ($1, 'equifax', 'sent', now() - interval '40 days', now() - interval '10 days') returning id`
      : `insert into dispatch_records (letter_id, bureau, status) values ($1, 'equifax', 'queued') returning id`,
    [letterId]
  )
  return { caseId, itemId, letterId, dispatchId: d.rows[0].id }
}

export function jsonRequest(url: string, method: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}
