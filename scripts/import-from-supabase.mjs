#!/usr/bin/env node
/**
 * One-time copy of Expunge's data from Supabase into the new Neon database.
 *
 * Run it on your own computer (connection strings stay on your machine):
 *
 *   SUPABASE_DB_URL='postgresql://...supabase...' \
 *   DATABASE_URL='postgresql://...neon...' \
 *   node scripts/import-from-supabase.mjs            # copy
 *   node scripts/import-from-supabase.mjs --check    # only compare row counts
 *
 * - Creates the schema on Neon first (db/schema.sql; safe to re-run).
 * - Copies Supabase Auth users with the same ids and their bcrypt password
 *   hashes, so everyone signs in with the password they already have.
 * - Copies every table with the same ids. Rows already on Neon are left alone,
 *   so running it twice does not duplicate anything. Subscriptions are
 *   overwritten from Supabase (Neon makes a free row for each new profile).
 * - Everything goes in one transaction: if any step fails, Neon is unchanged.
 * - Reads Supabase only. It never writes to or deletes from Supabase.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import pg from 'pg'

const here = path.dirname(fileURLToPath(import.meta.url))
const CHECK_ONLY = process.argv.includes('--check')

// Parents before children, so foreign keys always find their row.
const TABLES = [
  'profiles',
  'partner_settings',
  'partner_clients',
  'cases',
  'dispute_items',
  'letters',
  'dispatch_records',
  'outcomes',
  'intelligence_records',
  'dispute_knowledge_base',
  'orchestrator_memory',
  'subscriptions',
  'plan_limits',
]

function need(name) {
  const v = process.env[name]
  if (!v) {
    console.error(`Set ${name} first. See the comment at the top of this file.`)
    process.exit(1)
  }
  return v
}

const source = new pg.Client({ connectionString: need('SUPABASE_DB_URL') })
const target = new pg.Client({ connectionString: need('DATABASE_URL') })

async function tableExists(client, schema, table) {
  const { rows } = await client.query(`select to_regclass($1) is not null as ok`, [`${schema}.${table}`])
  return rows[0].ok
}

async function count(client, qualified) {
  const { rows } = await client.query(`select count(*)::int as n from ${qualified}`)
  return rows[0].n
}

async function report() {
  console.log('\nRow counts (Supabase -> Neon):')
  const pairs = [['auth.users', 'public.users'], ...TABLES.map((t) => [`public.${t}`, `public.${t}`])]
  let ok = true
  for (const [from, to] of pairs) {
    const [fs, ft] = from.split('.')
    const [ts, tt] = to.split('.')
    const a = (await tableExists(source, fs, ft)) ? await count(source, from) : null
    const b = (await tableExists(target, ts, tt)) ? await count(target, to) : null
    // Neon may hold extra free subscription rows only if Supabase lacked them.
    const match = a === b || (tt === 'subscriptions' && b !== null && a !== null && b >= a)
    if (!match) ok = false
    console.log(`  ${ft.padEnd(24)} ${String(a ?? '-').padStart(7)} -> ${String(b ?? '-').padStart(7)}  ${match ? 'ok' : 'DIFFERENT'}`)
  }
  return ok
}

/** Insert JSON rows into a table, letting Postgres convert every column type. */
async function insertRows(table, rows, conflict) {
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200)
    await target.query(
      `insert into public.${table}
       select * from jsonb_populate_recordset(null::public.${table}, $1::jsonb)
       ${conflict}`,
      [JSON.stringify(batch)]
    )
  }
}

async function main() {
  await source.connect()
  await target.connect()

  if (CHECK_ONLY) {
    const ok = await report()
    process.exit(ok ? 0 : 2)
  }

  console.log('Creating the schema on Neon (safe to re-run)...')
  await target.query(readFileSync(path.join(here, '../db/schema.sql'), 'utf8'))

  await target.query('begin')
  try {
    // 1. Users, with the same ids and bcrypt hashes.
    const { rows: users } = await source.query(`
      select id, lower(email) as email,
             coalesce(nullif(encrypted_password, ''), '!no-password') as password_hash,
             email_confirmed_at, created_at
        from auth.users
       where email is not null and deleted_at is null`)
    await insertRows('users', users, 'on conflict do nothing')
    const noPassword = users.filter((u) => !u.password_hash.startsWith('$2')).length
    console.log(`users: ${users.length} copied${noPassword ? ` (${noPassword} have no password and must use "Forgot password")` : ''}`)

    // 2. Every table, same ids.
    for (const table of TABLES) {
      if (!(await tableExists(source, 'public', table))) {
        console.log(`${table}: not in Supabase, skipped`)
        continue
      }
      const filter = table === 'profiles' ? `where id in (select id from auth.users where deleted_at is null)` : ''
      const { rows } = await source.query(`select to_jsonb(t) as r from public.${table} t ${filter}`)
      const data = rows.map((x) => x.r)
      let conflict = 'on conflict do nothing'
      if (table === 'subscriptions') {
        conflict = `on conflict (user_id) do update set
          plan = excluded.plan, status = excluded.status,
          square_customer_id = excluded.square_customer_id,
          square_subscription_id = excluded.square_subscription_id,
          square_card_id = excluded.square_card_id,
          current_period_start = excluded.current_period_start,
          current_period_end = excluded.current_period_end,
          cancel_at_period_end = excluded.cancel_at_period_end,
          client_seats = excluded.client_seats,
          created_at = excluded.created_at`
      }
      if (table === 'plan_limits') {
        conflict = `on conflict (plan) do update set
          max_cases = excluded.max_cases, max_items_per_case = excluded.max_items_per_case,
          tri_bureau = excluded.tri_bureau, escalation_bot = excluded.escalation_bot,
          partner_dashboard = excluded.partner_dashboard, monthly_price_cents = excluded.monthly_price_cents`
      }
      await insertRows(table, data, conflict)
      console.log(`${table}: ${data.length} copied`)
    }

    await target.query('commit')
  } catch (err) {
    await target.query('rollback')
    console.error('\nImport failed. Nothing was saved on Neon. Error:')
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }

  const ok = await report()
  console.log(ok ? '\nDone. Every table matches.' : '\nDone, but some counts differ. Check the lines marked DIFFERENT.')
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
  .finally(async () => {
    await source.end().catch(() => {})
    await target.end().catch(() => {})
  })
