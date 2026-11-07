import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'
import { createClient } from '@/lib/supabase/server'
import { normalizeInviteCode } from '@/lib/partner/firm'
import { getFirmByInviteCode } from '@/lib/partner/server'
import JoinButton from './JoinButton'

export const dynamic = 'force-dynamic'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params
  const code = normalizeInviteCode(rawCode)
  const firm = code ? await getFirmByInviteCode(code) : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <ExpungeLogo variant="primary" width={200} height={50} />
          </Link>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm text-center">
          {!firm || !code ? (
            <>
              <h1 className="text-2xl font-bold mb-3">This invite link isn&apos;t valid</h1>
              <p className="text-[#6B7280] text-sm mb-6">
                Ask the firm that sent it for a new link.
              </p>
              <Link href="/" className="text-[#F97316] font-medium">Go to the home page</Link>
            </>
          ) : (
            <>
              {firm.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={firm.logoUrl} alt={firm.firmName} className="h-14 mx-auto mb-4 object-contain" />
              )}
              <h1 className="text-2xl font-bold mb-3">{firm.firmName} invited you</h1>
              <p className="text-[#6B7280] text-sm mb-6">
                {firm.firmName} uses Expunge to review your credit report and prepare dispute
                letters for errors. Your access is covered by {firm.firmName}.
              </p>
              {user ? (
                <JoinButton code={code} firmName={firm.firmName} />
              ) : (
                <>
                  <Link
                    href={`/register?invite=${code}`}
                    className="inline-block w-full bg-[#F97316] hover:bg-[#EA580C] transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
                  >
                    Create my account
                  </Link>
                  <p className="text-[#6B7280] text-sm mt-4">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#F97316] font-medium">Sign in</Link>
                    , then open this link again.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
