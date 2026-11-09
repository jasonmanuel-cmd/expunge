import { normalizeInviteCode } from '@/lib/partner/firm'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'
import { getFirmByInviteCode, getFirmSeats } from '@/lib/partner/server'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  // A client who came from a firm's invite link signs up as a consumer linked
  // to that firm. Only a code that matches a real firm is passed on.
  const code = normalizeInviteCode(one(params.invite))
  const firm = code ? await getFirmByInviteCode(code) : null
  const inviteCode = firm ? code : null

  // Each client takes one of the firm's seats. When none is open, don't take
  // the sign-up (it would land as an account with no coverage).
  if (firm && (await getFirmSeats(firm.partnerId)).full) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} />
            </Link>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold mb-3">{firm.firmName} is full right now</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              {firm.firmName} has used all of its client seats on Expunge. Ask them to free one up or
              add more, then open their invite link again.
            </p>
            <Link href="/" className="text-[#F97316] font-medium">Go to the home page</Link>
          </div>
        </div>
      </div>
    )
  }

  // Expunge is sold only to firms. Without a valid invite, the only account
  // anyone can create is a firm account; clients join through their firm's link.
  const initialRole = inviteCode ? 'consumer' : 'partner'

  return (
    <RegisterForm
      inviteCode={inviteCode}
      inviteFirm={firm ? { firmName: firm.firmName, logoUrl: firm.logoUrl } : null}
      initialRole={initialRole}
    />
  )
}
