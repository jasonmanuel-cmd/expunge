import { normalizeInviteCode } from '@/lib/partner/firm'
import { getFirmByInviteCode } from '@/lib/partner/server'
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

  const wantsFirm = one(params.role) === 'partner' || one(params.plan) === 'partner'
  const initialRole = !inviteCode && wantsFirm ? 'partner' : 'consumer'

  return (
    <RegisterForm
      inviteCode={inviteCode}
      inviteFirm={firm ? { firmName: firm.firmName, logoUrl: firm.logoUrl } : null}
      initialRole={initialRole}
    />
  )
}
