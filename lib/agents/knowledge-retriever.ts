import { q } from '@/lib/db'
import type { DisputeType, Bureau } from '@/lib/types'

export interface KnowledgeContext {
  knowledgeBase: string
  orchestratorMemory: string
  hasMemory: boolean
}

type KBEntry = {
  category: string; title: string; content: string;
  source?: string; year?: number; effectiveness_score?: number
  [key: string]: unknown
}

type MemoryEntry = {
  dispute_type: string; bureau: string; legal_basis_used: string;
  outcome: string; insight: string; confidence_score?: number;
  sample_count?: number; success_rate?: number; avg_days_to_response?: number
  [key: string]: unknown
}

export async function retrieveKnowledge(
  disputeTypes: DisputeType[],
  bureaus: Bureau[]
): Promise<KnowledgeContext> {
  // Knowledge base: entries for these dispute types or bureaus, plus core law.
  // (The Supabase version filtered on a column named "categories", which
  // doesn't exist, so that query returned nothing. This one uses "category".)
  const kbEntries = await q<KBEntry>(
    `select category, title, content, source, year, effectiveness_score
       from dispute_knowledge_base
      where dispute_types @> $1::text[]
         or bureaus @> $2::text[]
         or category in ('fcra_law', 'case_law')
      order by effectiveness_score desc nulls last
      limit 20`,
    [disputeTypes, bureaus]
  )

  // Orchestrator memory: past learnings for these dispute types
  const memories = await q<MemoryEntry>(
    `select dispute_type, bureau, legal_basis_used, outcome, insight, confidence_score,
            sample_count, success_rate, avg_days_to_response
       from orchestrator_memory
      where dispute_type = any($1::text[])
      order by confidence_score desc nulls last, sample_count desc nulls last
      limit 15`,
    [disputeTypes]
  )

  return {
    knowledgeBase: formatKnowledgeBase(kbEntries),
    orchestratorMemory: formatMemory(memories),
    hasMemory: memories.length > 0,
  }
}

function formatKnowledgeBase(entries: KBEntry[]): string {
  if (entries.length === 0) return ''

  const grouped = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    if (!acc[e.category]) acc[e.category] = []
    acc[e.category].push(e)
    return acc
  }, {})

  const sections = Object.entries(grouped).map(([cat, items]) => {
    const header = cat.replace(/_/g, ' ').toUpperCase()
    const content = items.map((e) =>
      `### ${e.title}${e.year ? ` (${e.year})` : ''}
${e.content}
${e.source ? `Source: ${e.source}` : ''}`
    ).join('\n\n')
    return `## ${header}\n\n${content}`
  })

  return `=== KNOWLEDGE BASE: 30 YEARS OF FCRA DISPUTE HISTORY ===\n\n${sections.join('\n\n---\n\n')}`
}

function formatMemory(memories: MemoryEntry[]): string {
  if (memories.length === 0) return ''

  const lines = memories.map((m) => {
    const successPct = m.success_rate != null ? `${Math.round(m.success_rate * 100)}%` : 'unknown'
    const days = m.avg_days_to_response ? `~${Math.round(m.avg_days_to_response)}d` : '?'
    return `- [${m.dispute_type.toUpperCase()} @ ${m.bureau}] outcome:${m.outcome} | success_rate:${successPct} | avg_response:${days} | samples:${m.sample_count ?? 1} | confidence:${((m.confidence_score ?? 0) * 100).toFixed(0)}%
  Legal basis: ${m.legal_basis_used}
  Insight: ${m.insight}`
  }).join('\n\n')

  return `=== ORCHESTRATOR LEARNED MEMORY (${memories.length} patterns from real outcomes) ===\n\n${lines}`
}
