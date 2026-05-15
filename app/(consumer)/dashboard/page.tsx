import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

const STATUS_COLORS: Record<string, string> = {
  analyzing: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  routing: 'bg-[#2D6BE4]/10 text-[#2D6BE4] border-[#2D6BE4]/30',
  active: 'bg-[#2D6BE4]/10 text-[#2D6BE4] border-[#2D6BE4]/30',
  monitoring: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  completed: 'bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/30',
  escalated: 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]/30',
}

const ITEM_STATUS_COLORS: Record<string, string> = {
  pending: 'text-[#4a7fa8]',
  letter_drafted: 'text-[#2D6BE4]',
  dispatched: 'text-[#2D6BE4]',
  filed: 'text-cyan-400',
  under_review: 'text-yellow-400',
  received: 'text-orange-400',
  removed: 'text-[#27AE60]',
  modified: 'text-[#27AE60]',
  verified: 'text-[#E63946]',
  no_response: 'text-[#E63946]',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'partner') redirect('/partner/dashboard')

  const { data: cases } = await supabase
    .from('cases')
    .select('*, dispute_items(id, type, account_name, status, bureau)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const totalItems = cases?.flatMap((c) => c.dispute_items).length ?? 0
  const removedItems = cases?.flatMap((c) => c.dispute_items).filter((i) => i.status === 'removed').length ?? 0
  const activeItems = cases?.flatMap((c) => c.dispute_items).filter((i) => ['filed', 'under_review', 'dispatched'].includes(i.status)).length ?? 0

  return (
    <div className="min-h-screen bg-[#0D1B2E] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/billing" className="text-sm text-[#4a7fa8] hover:text-white transition">Billing</Link>
          <span className="text-[#4a7fa8] text-sm">{profile?.full_name || user.email}</span>
          <Link href="/upload" className="bg-[#E63946] hover:bg-[#c92e3a] transition px-4 py-2.5 rounded-lg text-sm font-bold text-white">
            + New dispute
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Total items disputed', value: totalItems, color: 'text-white' },
            { label: 'Items in progress', value: activeItems, color: 'text-[#2D6BE4]' },
            { label: 'Items removed', value: removedItems, color: 'text-[#27AE60]' },
          ].map((s) => (
            <div key={s.label} className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-6">
              <div className={`text-4xl font-bold mb-1 ${s.color}`}>{s.value}</div>
              <div className="text-[#4a7fa8] text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Cases */}
        <h2 className="text-xl font-semibold mb-4">Your cases</h2>

        {!cases || cases.length === 0 ? (
          <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <div className="font-semibold text-lg mb-2">No disputes yet</div>
            <div className="text-[#4a7fa8] text-sm mb-6">Upload your credit report to get started</div>
            <Link href="/upload" className="bg-[#E63946] hover:bg-[#c92e3a] transition px-6 py-3 rounded-lg font-bold text-white">
              Upload credit report
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {cases.map((c) => (
              <div key={c.id} className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-semibold">Case #{c.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-[#4a7fa8] text-sm">
                      {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium border px-3 py-1 rounded-full ${STATUS_COLORS[c.status] ?? 'text-[#4a7fa8]'}`}>
                      {c.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <Link href={`/disputes/${c.id}`} className="text-sm text-[#2D6BE4] hover:text-[#4a7fa8] transition">
                      View details →
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(c.dispute_items ?? []).slice(0, 8).map((item: { id: string; account_name: string; type: string; bureau: string; status: string }) => (
                    <div key={item.id} className="bg-[#0D1B2E] rounded-lg px-3 py-2">
                      <div className="text-xs font-medium truncate">{item.account_name}</div>
                      <div className="text-xs text-[#4a7fa8] capitalize">{item.type.replace('_', ' ')} · {item.bureau}</div>
                      <div className={`text-xs font-medium mt-1 ${ITEM_STATUS_COLORS[item.status] ?? 'text-[#4a7fa8]'}`}>
                        {item.status.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                  {(c.dispute_items ?? []).length > 8 && (
                    <div className="bg-[#0D1B2E] rounded-lg px-3 py-2 flex items-center justify-center">
                      <span className="text-xs text-[#4a7fa8]">+{c.dispute_items.length - 8} more</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
