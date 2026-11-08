import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'
import { PLANS } from '@/lib/square/client'
import { isFirmPlanActive } from '@/lib/partner/firm'
import FirmSettingsForm from './FirmSettingsForm'

const STATUS_COLORS: Record<string, string> = {
  analyzing: 'text-yellow-400',
  routing: 'text-[#F97316]',
  active: 'text-[#F97316]',
  monitoring: 'text-cyan-400',
  completed: 'text-[#16A34A]',
  escalated: 'text-[#F97316]',
}

export default async function PartnerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'partner') redirect('/dashboard')

  const { data: clients } = await supabase
    .from('partner_clients')
    .select(`
      consumer_id,
      profiles!partner_clients_consumer_id_fkey(full_name, email),
      cases:cases!cases_user_id_fkey(
        id, status, created_at,
        dispute_items(id, status)
      )
    `)
    .eq('partner_id', user.id)

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle()
  const planActive = isFirmPlanActive(sub?.plan, sub?.status)

  const { data: settings } = await supabase
    .from('partner_settings')
    .select('firm_name, logo_url, invite_code')
    .eq('partner_id', user.id)
    .maybeSingle()
  const firmName = settings?.firm_name ?? ''

  const totalClients = clients?.length ?? 0
  const activeClients = clients?.filter((c) =>
    (c.cases as { status: string }[] ?? []).some((cas) => ['active', 'monitoring', 'escalated'].includes(cas.status))
  ).length ?? 0

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827]">
      <header className="border-b border-[#E5E7EB] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
          <span className="ml-2 text-xs bg-[#F97316]/20 text-[#F97316] px-2 py-0.5 rounded-full">Firm</span>
        </div>
        <div className="flex items-center gap-4">
          {planActive && <Link href="/billing" className="text-sm text-[#6B7280] hover:text-[#111827] transition">Billing</Link>}
          <span className="text-[#6B7280] text-sm">{firmName || profile?.full_name || user.email}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-10">
        <h1 className="text-2xl font-bold mb-8">{firmName ? `${firmName} dashboard` : 'Firm dashboard'}</h1>

        {/* Plan status */}
        {planActive ? (
          <div className="mb-6 bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-5 text-sm">
            <span className="font-semibold text-[#16A34A]">Firm plan active.</span>{' '}
            Every client who joins with your invite link gets full Pro access at no cost to them.
          </div>
        ) : (
          <div className="mb-6 bg-gradient-to-r from-[#F97316] to-[#EA580C] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-200">
            <div>
              <div className="font-bold text-lg">Start your firm plan</div>
              <div className="text-white/80 text-sm mt-0.5">
                {PLANS.partner.priceLabel} covers all your clients. Until it&apos;s active, clients who join stay on the free tier.
              </div>
            </div>
            <Link href="/checkout?plan=partner" className="bg-white text-[#F97316] hover:bg-orange-50 transition font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap shadow-md">
              Start firm plan →
            </Link>
          </div>
        )}

        <div className="mb-10">
          <FirmSettingsForm
            initialFirmName={firmName}
            initialLogoUrl={settings?.logo_url ?? ''}
            initialInviteCode={settings?.invite_code ?? null}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6">
            <div className="text-4xl font-bold mb-1">{totalClients}</div>
            <div className="text-[#6B7280] text-sm">Total clients</div>
          </div>
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-6">
            <div className="text-4xl font-bold text-[#F97316] mb-1">{activeClients}</div>
            <div className="text-[#6B7280] text-sm">Active disputes</div>
          </div>
        </div>

        {/* Client roster */}
        <h2 className="text-lg font-semibold mb-4">Client roster</h2>

        {!clients || clients.length === 0 ? (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-16 text-center">
            <div className="text-5xl mb-4">👥</div>
            <div className="font-semibold text-lg mb-2">No clients yet</div>
            <div className="text-[#6B7280] text-sm">Clients appear here once they sign up with your invite link</div>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const cases = client.cases as Array<{ id: string; status: string; created_at: string; dispute_items: Array<{ id: string; status: string }> }> ?? []
              const allItems = cases.flatMap((c) => c.dispute_items ?? [])
              const removedCount = allItems.filter((i) => i.status === 'removed').length
              const totalCount = allItems.length
              const latestCase = cases.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
              const profile = (Array.isArray(client.profiles) ? client.profiles[0] : client.profiles) as { full_name: string; email: string } | null

              return (
                <div key={client.consumer_id} className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{profile?.full_name || 'Unknown'}</div>
                    <div className="text-[#6B7280] text-sm">{profile?.email}</div>
                    <div className="text-[#6B7280] text-xs mt-1">
                      {totalCount} items disputed · <span className="text-[#16A34A]">{removedCount}</span> removed
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {latestCase && (
                      <div className={`text-sm font-medium ${STATUS_COLORS[latestCase.status] ?? 'text-[#6B7280]'}`}>
                        {latestCase.status.replace('_', ' ').toUpperCase()}
                      </div>
                    )}
                    {latestCase && (
                      <Link
                        href={`/disputes/${latestCase.id}`}
                        className="text-sm text-[#F97316] hover:text-[#6B7280] transition"
                      >
                        View →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
