import { NextRequest, NextResponse } from 'next/server'
import { q } from '@/lib/db'

// GET /api/orchestrator/memory — inspect what the orchestrator has learned
export async function GET(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_SECRET
    if (!adminSecret || req.headers.get('x-admin-secret') !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const disputeType = searchParams.get('type')
    const bureau = searchParams.get('bureau')
    const minSamples = parseInt(searchParams.get('min_samples') ?? '1') || 1

    const data = await q(
      `select * from orchestrator_memory
        where sample_count >= $1
          and ($2::text is null or dispute_type = $2)
          and ($3::text is null or bureau = $3)
        order by confidence_score desc, sample_count desc
        limit 50`,
      [minSamples, disputeType, bureau]
    )

    // Also return a summary of overall stats
    type StatRow = { outcome: string; success_rate: number | null; sample_count: number | null; dispute_type: string }
    type TypeSummary = { samples: number; avgSuccess: number }
    const stats = await q<StatRow>(
      `select outcome, success_rate, sample_count, dispute_type from orchestrator_memory`
    )

    const totalSamples = stats.reduce((acc, s) => acc + (s.sample_count ?? 0), 0)
    const overallSuccessRate = stats.length > 0
      ? stats.reduce((acc, s) => acc + ((s.success_rate ?? 0) * (s.sample_count ?? 1)), 0) / (totalSamples || 1)
      : 0

    const byType = stats.reduce<Record<string, TypeSummary>>((acc, s) => {
      if (!acc[s.dispute_type]) acc[s.dispute_type] = { samples: 0, avgSuccess: 0 }
      acc[s.dispute_type].samples += s.sample_count ?? 1
      acc[s.dispute_type].avgSuccess = (
        acc[s.dispute_type].avgSuccess * (acc[s.dispute_type].samples - (s.sample_count ?? 1)) +
        (s.success_rate ?? 0) * (s.sample_count ?? 1)
      ) / acc[s.dispute_type].samples
      return acc
    }, {})

    return NextResponse.json({
      memories: data,
      summary: {
        totalPatterns: data.length,
        totalSamples,
        overallSuccessRate: Math.round(overallSuccessRate * 100),
        byType,
      },
    })
  } catch (err) {
    console.error('Memory query error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
