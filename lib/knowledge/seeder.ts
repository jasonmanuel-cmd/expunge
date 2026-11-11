import { insert, q1 } from '@/lib/db'
import { KNOWLEDGE_SEED } from './seed-data'

export async function seedKnowledgeBase(): Promise<{ inserted: number; skipped: number }> {
  const existing = await q1<{ n: number }>(`select count(*)::int as n from dispute_knowledge_base`)
  if ((existing?.n ?? 0) > 0) {
    return { inserted: 0, skipped: KNOWLEDGE_SEED.length }
  }

  try {
    const data = await insert('dispute_knowledge_base', KNOWLEDGE_SEED as unknown as Record<string, unknown>[])
    return { inserted: data.length, skipped: 0 }
  } catch (err) {
    throw new Error(`Knowledge base seed failed: ${err instanceof Error ? err.message : String(err)}`)
  }
}
