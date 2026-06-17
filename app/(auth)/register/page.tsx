'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'consumer' | 'partner'>('consumer')
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const next = role === 'partner' ? '/partner/dashboard' : '/dashboard'
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        data: {
          full_name: fullName,
          role,
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          city,
          state,
          zip_code: zipCode,
          ssn_last4: ssnLast4,
          date_of_birth: dateOfBirth,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // The DB trigger (handle_new_user) creates the profile row with all the
    // metadata above. When email confirmation is enabled there is no session
    // yet, so show the "check your inbox" screen. When it's disabled a session
    // exists and we can go straight to the dashboard.
    if (authData?.session) {
      router.push(next)
      return
    }

    setEmailSent(true)
    setLoading(false)
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} />
            </Link>
          </div>
          <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-3">Check your inbox</h1>
            <p className="text-[#4a7fa8] text-sm mb-2">
              We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            </p>
            <p className="text-[#4a7fa8] text-sm mb-6">
              Click it to verify your account, then you&apos;ll be taken to your dashboard.
              The link may take a minute to arrive — check spam too.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-[#2D6BE4] hover:bg-[#245bc4] transition py-3 rounded-lg font-bold text-white"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <ExpungeLogo variant="primary" width={200} height={50} />
          </Link>
        </div>

        <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Create account</h1>
          <p className="text-[#4a7fa8] text-sm mb-6">Start automating your credit disputes</p>

          {error && (
            <div className="bg-[#E63946]/10 border border-[#E63946]/30 text-[#E63946] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(['consumer', 'partner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2.5 rounded-lg text-sm font-medium border transition ${
                    role === r
                      ? 'bg-[#2D6BE4] border-[#2D6BE4] text-white'
                      : 'bg-[#0D1B2E] border-white/10 text-[#4a7fa8] hover:text-white'
                  }`}
                >
                  {r === 'consumer' ? 'Consumer' : 'Partner / Agency'}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                placeholder="Min 8 characters"
              />
            </div>

            {/* Address section */}
            <div className="pt-2 border-t border-white/10">
              <h2 className="text-sm font-semibold text-white mb-3">Personal information for dispute letters</h2>
              <p className="text-xs text-[#4a7fa8] mb-4">Required by credit bureaus to process your disputes. Stored encrypted.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Address line 1 <span className="text-[#E63946]">*</span></label>
                  <input
                    type="text"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    required
                    className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                    placeholder="123 Main St"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">Address line 2 <span className="text-[#4a7fa8] text-xs">(optional)</span></label>
                  <input
                    type="text"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                    placeholder="Apt 4B, Suite 200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">City <span className="text-[#E63946]">*</span></label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                      placeholder="Los Angeles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">State <span className="text-[#E63946]">*</span></label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      required
                      maxLength={2}
                      minLength={2}
                      pattern="[A-Za-z]{2}"
                      className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition uppercase"
                      placeholder="CA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1.5">ZIP code <span className="text-[#E63946]">*</span></label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                    pattern="[0-9]{5}(-[0-9]{4})?"
                    className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                    placeholder="90210"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">SSN (last 4) <span className="text-[#E63946]">*</span></label>
                    <input
                      type="password"
                      value={ssnLast4}
                      onChange={(e) => setSsnLast4(e.target.value)}
                      required
                      pattern="[0-9]{4}"
                      maxLength={4}
                      minLength={4}
                      autoComplete="off"
                      className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                      placeholder="••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-1.5">Date of birth <span className="text-[#E63946]">*</span></label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                      className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E63946] hover:bg-[#c92e3a] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-[#4a7fa8] text-sm mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#2D6BE4] hover:text-[#4a7fa8] transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
