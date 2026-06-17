import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

const TIMELINE_STEPS = ['pending', 'letter_drafted', 'dispatched', 'filed', 'under_review', 'received']
const OUTCOME_STEPS = ['removed', 'modified', 'verified', 'no_response']

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    removed: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30',
    modified: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30',
    verified: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30',
    no_response: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    filed: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    under_review: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    dispatched: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30',
    letter_drafted: 'bg-[#F97316]/10 text-[#F97316] border-[#F97316]/30',
    pending: 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/30',
  }
  return (
    <span className={`text-xs font-medium border px-3 py-1 rounded-full ${colors[status] ?? 'text-[#6B7280]'}`}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caseData } = await supabase
    .from('cases')
    .select(`
      *,
      dispute_items(
        *,
        letters(*, dispatch_records(*, outcomes(*)))
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!caseData) notFound()

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
        <Link href="/dashboard" className="text-sm text-[#6B7280] hover:text-[#111827] transition">← Back to dashboard</Link>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Case #{caseData.id.slice(0, 8).toUpperCase()}</h1>
          <div className="text-[#6B7280] text-sm">
            Opened {new Date(caseData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            {' · '}{caseData.dispute_items?.length ?? 0} items · Round {caseData.round}
          </div>
        </div>

        <div className="space-y-6">
          {(caseData.dispute_items ?? []).map((item: {
            id: string; account_name: string; type: string; bureau: string; status: string;
            dispute_reason: string; legal_basis: string; amount?: number; round: number;
            letters: Array<{ id: string; bureau: string; content: string; round: number; is_cfpb_complaint: boolean;
              dispatch_records: Array<{ id: string; bureau: string; status: string; sent_at?: string; response_due_at?: string;
                outcomes: Array<{ result: string; recorded_at: string }> }> }>;
          }) => {
            const allLetters = item.letters ?? []
            const allDispatches = allLetters.flatMap((l) => l.dispatch_records ?? [])
            const latestOutcome = allDispatches.flatMap((d) => d.outcomes ?? []).slice(-1)[0]
            const nextResponseDate = allDispatches
              .filter((d) => d.status === 'sent' && d.response_due_at)
              .sort((a, b) => new Date(a.response_due_at!).getTime() - new Date(b.response_due_at!).getTime())[0]?.response_due_at

            const isOutcome = OUTCOME_STEPS.includes(item.status)
            const stepIndex = isOutcome
              ? TIMELINE_STEPS.length
              : TIMELINE_STEPS.indexOf(item.status)

            return (
              <div key={item.id} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-lg">{item.account_name}</div>
                    <div className="text-[#6B7280] text-sm capitalize">
                      {item.type.replace('_', ' ')} · {item.bureau} · Round {item.round}
                      {item.amount ? ` · $${item.amount.toLocaleString()}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <div className="text-sm text-[#374151] mb-4">
                  <strong className="text-[#6B7280]">Dispute reason:</strong> {item.dispute_reason}
                  <br />
                  <strong className="text-[#6B7280]">Legal basis:</strong> {item.legal_basis}
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-0 mb-4 overflow-x-auto pb-2">
                  {TIMELINE_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center">
                      <div className={`flex flex-col items-center ${i < stepIndex ? 'opacity-100' : i === stepIndex ? 'opacity-100' : 'opacity-30'}`}>
                        <div className={`w-3 h-3 rounded-full ${i < stepIndex ? 'bg-[#F97316]' : i === stepIndex ? 'bg-[#F97316] ring-2 ring-[#F97316]/30' : 'bg-[#6B7280]'}`} />
                        <span className="text-xs text-[#6B7280] mt-1 whitespace-nowrap">{step.replace(/_/g, ' ')}</span>
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`h-px w-8 mx-1 mt-[-10px] ${i < stepIndex ? 'bg-[#F97316]' : 'bg-[#6B7280]'}`} />
                      )}
                    </div>
                  ))}
                  {isOutcome && (
                    <div className="flex items-center ml-1">
                      <div className="h-px w-8 bg-[#F97316] mt-[-10px]" />
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ring-2 ${
                          item.status === 'removed' ? 'bg-[#16A34A] ring-[#16A34A]/30' :
                          item.status === 'modified' ? 'bg-[#16A34A] ring-[#16A34A]/30' :
                          'bg-[#F97316] ring-[#F97316]/30'
                        }`} />
                        <span className="text-xs text-[#6B7280] mt-1">{item.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {nextResponseDate && (
                  <div className="text-xs text-cyan-400 mb-3">
                    Response due by {new Date(nextResponseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}

                {latestOutcome && (
                  <div className="text-xs text-[#6B7280] mb-3">
                    Outcome recorded {new Date(latestOutcome.recorded_at).toLocaleDateString()}
                  </div>
                )}

                {/* Letters */}
                {allLetters.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-sm text-[#F97316] cursor-pointer hover:text-[#6B7280] transition">
                      View {allLetters.length} letter{allLetters.length !== 1 ? 's' : ''}
                    </summary>
                    <div className="mt-3 space-y-3">
                      {allLetters.map((letter) => (
                        <div key={letter.id} className="bg-[#F5F5F7] rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-[#374151] capitalize">{letter.bureau.replace('_', ' ')}</span>
                            {letter.is_cfpb_complaint && (
                              <span className="text-xs bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30 px-2 py-0.5 rounded-full">CFPB</span>
                            )}
                            <span className="text-xs text-[#6B7280]">Round {letter.round}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <a
                              href={`/api/letters/${letter.id}/pdf`}
                              className="text-xs bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30 px-3 py-1 rounded-full hover:bg-[#F97316]/20 transition"
                              target="_blank"
                            >
                              Download PDF
                            </a>
                          </div>
                          <pre className="text-xs text-[#6B7280] whitespace-pre-wrap font-mono leading-relaxed max-h-48 overflow-y-auto">
                            {letter.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
