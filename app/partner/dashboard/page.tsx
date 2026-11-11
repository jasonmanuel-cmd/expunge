import { getSessionUser } from '@/lib/auth'
import { q, q1 } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'
import { FIRM_MONTHLY, FIRM_ANNUAL, MORE_SEATS_URL } from '@/lib/pricing'
import { holdsSeat, seatUsage } from '@/lib/partner/firm'
import { getFirmPlanState } from '@/lib/partner/server'
import FirmSettingsForm from './FirmSettingsForm'
import RemoveClientButton from './RemoveClientButton'

const STATUS_COLORS: Record<string, string> = {
  analyzing: 'text-yellow-400',
  routing: 'text-[#F97316]',
  active: 'text-[#F97316]',
  monitoring: 'text-cyan-400',
  completed: 'text-[#16A34A]',
  escalated: 'text-[#F97316]',
}

export default async function PartnerDashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const profile = await q1<{ role: string; full_name: string | null }>(
    `select role, full_name from profiles where id = $1`,
    [user.id]
  )

  if (profile?.role !== 'partner') redirect('/dashboard')

  // Only this firm's own clients, and only their cases.
  const clients = await q<{
    consumer_id: string
    created_at: string
    profiles: { full_name: string; email: string } | null
    cases: Array<{ id: string; status: string; created_at: string; dispute_items: Array<{ id: string; status: string }> }>
  }>(
    `select pc.consumer_id, pc.created_at,
            json_build_object('full_name', p.full_name, 'email', p.email) as profiles,
            coalesce((
              select json_agg(json_build_object(
                       'id', c.id, 'status', c.status, 'created_at', c.created_at,
                       'dispute_items', coalesce((
                         select json_agg(json_build_object('id', di.id, 'status', di.status))
                           from dispute_items di where di.case_id = c.id), '[]'::json))
                     order by c.created_at desc)
                from cases c where c.user_id = pc.consumer_id), '[]'::json) as cases
       from partner_clients pc
       join profiles p on p.id = pc.consumer_id
      where pc.partner_id = $1
      -- Seats go to clients in the order they joined.
      order by pc.created_at asc`,
    [user.id]
  )

  const { active: planActive, seatLimit } = await getFirmPlanState(user.id)

  const settings = await q1<{ firm_name: string; logo_url: string | null; invite_code: string }>(
    `select firm_name, logo_url, invite_code from partner_settings where partner_id = $1`,
    [user.id]
  )
  const firmName = settings?.firm_name ?? ''

  const totalClients = clients?.length ?? 0
  const seats = seatUsage(totalClients, seatLimit)
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
            Your plan includes {seats.limit} client seats. Each client who joins with your invite link takes one and gets full access. Clients never pay Expunge.
          </div>
        ) : (
          <div className="mb-6 bg-gradient-to-r from-[#F97316] to-[#EA580C] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-orange-200">
            <div>
              <div className="font-bold text-lg">Start your firm plan</div>
              <div className="text-white/80 text-sm mt-0.5">
                {FIRM_MONTHLY.priceLabel} covers up to {FIRM_MONTHLY.clientSeats} clients, or {FIRM_ANNUAL.priceLabel} up to {FIRM_ANNUAL.clientSeats}. Until a plan is active, clients who join can sign in but can&apos;t start a review.
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link href="/checkout?plan=partner" className="bg-white text-[#F97316] hover:bg-orange-50 transition font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap shadow-md text-center">
                Start monthly →
              </Link>
              <Link href="/checkout?plan=partner_annual" className="border border-white/40 hover:bg-white/10 transition font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap text-center">
                Annual license
              </Link>
            </div>
          </div>
        )}

        {/* Client seats */}
        {seats.full ? (
          <div className="mb-6 bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-5 text-sm text-[#374151] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-[#111827]">
                {seats.over > 0
                  ? `You have ${seats.used} clients and ${seats.limit} seats.`
                  : `You've used all ${seats.limit} client seats.`}
              </div>
              <div className="mt-0.5">
                New clients can&apos;t join with your invite link until a seat opens.
                {seats.over > 0 && ` The ${seats.over} who joined last can't start new reviews.`}
                {' '}Remove a client you no longer serve, or ask for more seats.
              </div>
            </div>
            <Link href={MORE_SEATS_URL} className="bg-[#F97316] hover:bg-[#EA580C] transition text-white font-bold px-5 py-2.5 rounded-lg whitespace-nowrap text-center">
              Request more seats
            </Link>
          </div>
        ) : seats.open <= Math.max(3, Math.ceil(seats.limit * 0.1)) ? (
          <div className="mb-6 bg-white border border-[#E5E7EB] rounded-2xl p-4 text-sm text-[#374151]">
            {seats.open} client seat{seats.open === 1 ? '' : 's'} left.{' '}
            <Link href={MORE_SEATS_URL} className="text-[#F97316] font-medium">Request more seats</Link>
          </div>
        ) : null}

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
            <div className="text-4xl font-bold mb-1">
              {seats.used}<span className="text-xl text-[#6B7280] font-medium"> / {seats.limit}</span>
            </div>
            <div className="text-[#6B7280] text-sm">Client seats used</div>
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
            {clients.map((client, index) => {
              const seated = holdsSeat(index + 1, seats.limit)
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
                    {!seated && (
                      <div className="text-[#C2410C] text-xs mt-1 font-medium">Over your seat limit: can&apos;t start new reviews</div>
                    )}
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
                    <RemoveClientButton consumerId={client.consumer_id} name={profile?.full_name || profile?.email || 'this client'} />
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
