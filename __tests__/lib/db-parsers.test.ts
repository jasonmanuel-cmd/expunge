import { describe, it, expect } from 'vitest'
import { pgTimestampToIso } from '@/lib/db'

describe('pgTimestampToIso', () => {
  it('turns Postgres timestamptz text into ISO strings', () => {
    expect(pgTimestampToIso('2026-10-01 10:11:12.123456+00')).toBe('2026-10-01T10:11:12.123Z')
    expect(pgTimestampToIso('2026-10-01 03:11:12-07')).toBe('2026-10-01T10:11:12.000Z')
    expect(pgTimestampToIso('2026-10-01 15:41:12+05:30')).toBe('2026-10-01T10:11:12.000Z')
  })
  it('is safe to apply twice (Next.js can load the module more than once)', () => {
    const once = pgTimestampToIso('2026-10-01 10:11:12+00')
    expect(pgTimestampToIso(once)).toBe(once)
  })
})
