'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpAction } from '@/app/(auth)/actions'
import ExpungeLogo from '@/components/ExpungeLogo'

interface Props {
  /** Valid invite code from /join/CODE, already checked on the server. */
  inviteCode: string | null
  inviteFirm: { firmName: string; logoUrl: string | null } | null
  initialRole: 'consumer' | 'partner'
}

export default function RegisterForm({ inviteCode, inviteFirm, initialRole }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  // Clients only sign up through a firm's invite; everyone else creates a firm account.
  const role: 'consumer' | 'partner' = inviteCode ? 'consumer' : initialRole
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [ssnLast4, setSsnLast4] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const isFirm = role === 'partner'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // A firm that arrived from a plan CTA (/register?plan=partner) continues to
    // checkout after signup. Invited clients are covered by their firm and
    // never see checkout; there are no consumer plans.
    const planParam = isFirm ? new URLSearchParams(window.location.search).get('plan') : null
    const isFirmPlan = planParam === 'partner' || planParam === 'partner_annual'
    const next = isFirmPlan
      ? `/checkout?plan=${planParam}`
      : isFirm
        ? '/partner/dashboard'
        : '/dashboard'
    // The server creates the account and profile, and links an invited client
    // to their firm. Firm accounts don't dispute their own credit, so they skip
    // the personal details. `next` is remembered for after the confirm link.
    const result = await signUpAction({
      email,
      password,
      fullName,
      role,
      next,
      ...(isFirm
        ? {}
        : {
            addressLine1,
            addressLine2: addressLine2 || null,
            city,
            state,
            zipCode,
            ssnLast4,
            dateOfBirth,
            inviteCode,
          }),
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // With email confirmation off the user is signed in already.
    if (result.signedIn) {
      router.push(next)
      router.refresh()
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  const inputClass =
    'w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition'

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} />
            </Link>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-[#111827] mb-3">Check your inbox</h1>
            <p className="text-[#6B7280] text-sm mb-2">
              We sent a confirmation link to <span className="text-[#111827] font-medium">{email}</span>.
            </p>
            <p className="text-[#6B7280] text-sm mb-6">
              Click it to verify your account, then you&apos;ll be taken to your dashboard.
              The link may take a minute to arrive — check spam too.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-[#F97316] hover:bg-[#EA580C] transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <ExpungeLogo variant="primary" width={200} height={50} />
          </Link>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
          {inviteFirm && (
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-lg px-4 py-3 text-sm mb-5 flex items-center gap-3">
              {inviteFirm.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={inviteFirm.logoUrl} alt="" className="h-8 w-8 object-contain" />
              )}
              <span>
                <span className="font-semibold">{inviteFirm.firmName}</span> invited you. Your access is covered by them.
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-[#111827] mb-2">
            {isFirm ? 'Create your firm account' : 'Create account'}
          </h1>
          <p className="text-[#6B7280] text-sm mb-6">
            {isFirm
              ? 'Business accounts for tax, finance and lending firms. Your clients join free from your invite link.'
              : 'Review your credit report and prepare dispute letters you mail yourself'}
          </p>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm text-[#374151] mb-1.5">{isFirm ? 'Your name' : 'Full name'}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm text-[#374151] mb-1.5">{isFirm ? 'Work email' : 'Email'}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-[#374151] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
                placeholder="Min 8 characters"
              />
            </div>

            {/* Address section (clients only) */}
            {!isFirm && (
            <div className="pt-2 border-t border-[#E5E7EB]">
              <h2 className="text-sm font-semibold text-[#111827] mb-3">Personal information for dispute letters</h2>
              <p className="text-xs text-[#6B7280] mb-4">Required by credit bureaus to process your disputes. Stored encrypted.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#374151] mb-1.5">Address line 1 <span className="text-[#DC2626]">*</span></label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#374151] mb-1.5">Address line 2 <span className="text-[#9CA3AF] text-xs">(optional)</span></label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className={inputClass}
                    placeholder="Apt 4B, Suite 200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[#374151] mb-1.5">City <span className="text-[#DC2626]">*</span></label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Los Angeles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#374151] mb-1.5">State <span className="text-[#DC2626]">*</span></label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      required
                      maxLength={2}
                      minLength={2}
                      pattern="[A-Za-z]{2}"
                      className={`${inputClass} uppercase`}
                      placeholder="CA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#374151] mb-1.5">ZIP code <span className="text-[#DC2626]">*</span></label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                    pattern="[0-9]{5}(-[0-9]{4})?"
                    className={inputClass}
                    placeholder="90210"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[#374151] mb-1.5">SSN (last 4) <span className="text-[#DC2626]">*</span></label>
                    <input
                      type="password"
                      value={ssnLast4}
                      onChange={(e) => setSsnLast4(e.target.value)}
                      required
                      pattern="[0-9]{4}"
                      maxLength={4}
                      minLength={4}
                      autoComplete="off"
                      className={inputClass}
                      placeholder="••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[#374151] mb-1.5">Date of birth <span className="text-[#DC2626]">*</span></label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          {isFirm && (
            <p className="text-center text-[#6B7280] text-xs mt-6">
              Not a business? Expunge is provided through firms. If your tax preparer or advisor uses
              Expunge, sign up with the invite link they sent you.
            </p>
          )}

          <p className="text-center text-[#6B7280] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#F97316] hover:text-[#EA580C] transition font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
