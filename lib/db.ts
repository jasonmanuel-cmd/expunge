import { Pool, types, type PoolClient } from 'pg'

/**
 * Postgres access for Expunge (Neon in production).
 *
 * Every query runs on the server. There is no row-level security, so any
 * query that returns user data MUST filter by the signed-in user's id (or by
 * the firm/client link). __tests__/db/access.test.ts checks that per route.
 *
 * Values come back the way supabase-js returned them, so existing code keeps
 * working: timestamps as ISO strings, dates as 'YYYY-MM-DD', numeric as numbers.
 */

/**
 * Postgres timestamptz text ('2026-10-01 10:11:12.123456+00') to an ISO string.
 * Self-contained on purpose: Next.js can load this module more than once, and
 * wrapping pg's own parser would then wrap our parser and break.
 */
export function pgTimestampToIso(v: string): string {
  if (v === 'infinity' || v === '-infinity') return v
  const iso = v
    .replace(' ', 'T')
    .replace(/([+-]\d{2})$/, '$1:00') // +00 -> +00:00
    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? v : d.toISOString()
}

types.setTypeParser(types.builtins.TIMESTAMPTZ, pgTimestampToIso)
types.setTypeParser(types.builtins.TIMESTAMP, (v) => pgTimestampToIso(v + '+00'))
types.setTypeParser(types.builtins.DATE, (v) => v)
types.setTypeParser(types.builtins.NUMERIC, (v) => (v === null ? null : Number(v)))
types.setTypeParser(types.builtins.INT8, (v) => (v === null ? null : Number(v)))

export type Row = Record<string, unknown>

/** Something that can run a parameterised query. */
export interface Querier {
  query<T extends Row = Row>(text: string, params?: unknown[]): Promise<{ rows: T[] }>
}

/** A database: runs queries, and runs a function inside a transaction. */
export interface Database extends Querier {
  transaction<T>(fn: (tx: Querier) => Promise<T>): Promise<T>
}

const globalForDb = globalThis as unknown as { expungePool?: Pool; expungeTestDb?: Database | null }

function pool(): Pool {
  if (!globalForDb.expungePool) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    globalForDb.expungePool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 })
  }
  return globalForDb.expungePool
}

const pgDatabase: Database = {
  async query<T extends Row = Row>(text: string, params: unknown[] = []) {
    const res = await pool().query(text, params)
    return { rows: res.rows as T[] }
  },
  async transaction<T>(fn: (tx: Querier) => Promise<T>): Promise<T> {
    const client: PoolClient = await pool().connect()
    try {
      await client.query('begin')
      const result = await fn({
        async query<R extends Row = Row>(text: string, params: unknown[] = []) {
          const res = await client.query(text, params)
          return { rows: res.rows as R[] }
        },
      })
      await client.query('commit')
      return result
    } catch (err) {
      await client.query('rollback').catch(() => {})
      throw err
    } finally {
      client.release()
    }
  },
}

/** Tests swap in an in-memory Postgres (PGlite). */
export function setDatabaseForTests(db: Database | null) {
  globalForDb.expungeTestDb = db
}

export function db(): Database {
  return globalForDb.expungeTestDb ?? pgDatabase
}

/** Run a query and return all rows. */
export async function q<T extends Row = Row>(text: string, params: unknown[] = [], on: Querier = db()): Promise<T[]> {
  return (await on.query<T>(text, params)).rows
}

/** Run a query and return the first row, or null. */
export async function q1<T extends Row = Row>(text: string, params: unknown[] = [], on: Querier = db()): Promise<T | null> {
  return (await q<T>(text, params, on))[0] ?? null
}

export function tx<T>(fn: (tx: Querier) => Promise<T>): Promise<T> {
  return db().transaction(fn)
}

// ---------------------------------------------------------------------------
// Small helpers for inserts and updates. Table and column names always come
// from code, never from user input; they are still checked to be plain names.
// ---------------------------------------------------------------------------

const IDENT = /^[a-z_][a-z0-9_]*$/

function ident(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Bad SQL identifier: ${name}`)
  return name
}

/** jsonb columns get JSON text; arrays of plain values stay arrays (text[] columns). */
function toParam(v: unknown): unknown {
  if (v === undefined) return null
  if (v === null || v instanceof Date) return v
  if (Array.isArray(v)) {
    return v.every((x) => x === null || typeof x !== 'object') ? v : JSON.stringify(v)
  }
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}

/** Insert one or more rows; returns the inserted rows. */
export async function insert<T extends Row = Row>(
  table: string,
  rows: Row | Row[],
  opts: { onConflict?: string; on?: Querier } = {}
): Promise<T[]> {
  const list = Array.isArray(rows) ? rows : [rows]
  if (list.length === 0) return []
  // Union of keys across rows, so rows that leave out an optional field still line up.
  const cols = [...new Set(list.flatMap((r) => Object.keys(r)))].map(ident)
  const params: unknown[] = []
  const values = list.map((row) => {
    const ph = cols.map((c) => {
      params.push(toParam(row[c]))
      return `$${params.length}`
    })
    return `(${ph.join(', ')})`
  })
  const conflict = opts.onConflict ? ` ${opts.onConflict}` : ''
  const sql = `insert into ${ident(table)} (${cols.join(', ')}) values ${values.join(', ')}${conflict} returning *`
  return q<T>(sql, params, opts.on)
}

/**
 * Update rows matching every key in `where` (all ANDed with =).
 * Returns the updated rows.
 */
export async function update<T extends Row = Row>(
  table: string,
  fields: Row,
  where: Row,
  on?: Querier
): Promise<T[]> {
  const params: unknown[] = []
  const sets = Object.keys(fields).map((c) => {
    params.push(toParam(fields[c]))
    return `${ident(c)} = $${params.length}`
  })
  const conds = Object.keys(where).map((c) => {
    params.push(where[c])
    return `${ident(c)} = $${params.length}`
  })
  if (sets.length === 0) throw new Error('update() needs at least one field')
  if (conds.length === 0) throw new Error('update() needs a where clause')
  return q<T>(
    `update ${ident(table)} set ${sets.join(', ')} where ${conds.join(' and ')} returning *`,
    params,
    on
  )
}
