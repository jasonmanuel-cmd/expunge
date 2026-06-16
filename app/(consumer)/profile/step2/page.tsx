'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function ProfileStep2Page() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [ssnLast4, setSsnLast4] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, address_line1, address_line2, city, state, zip_code, ssn_last4, date_of_birth')
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setAddressLine1(profile.address_line1 || '')
        setAddressLine2(profile.address_line2 || '')
        setCity(profile.city || '')
        setState(profile.state || '')
        setZipCode(profile.zip_code || '')
        setSsnLast4(profile.ssn_last4 || '')
        setDateOfBirth(profile.date_of_birth || '')
      }
      setChecking(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        state,
        zip_code: zipCode,
        ssn_last4: ssnLast4,
        date_of_birth: dateOfBirth,
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push('/consumer/upload')
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D6BE4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#4a7fa8]">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] text-white flex flex-col">
      <header className="border-b border-white/10 px-8 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
        <Link href="/dashboard" className="text-sm text-[#4a7fa8] hover:text-white transition">
          Back to dashboard
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#27AE60] flex items-center justify-center text-white text-sm font-bold">✓</div>
              <span className="text-sm text-[#27AE60]">Account created</span>
            </div>
            <div className="flex-1 h-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#E63946] flex items-center justify-center text-white text-sm font-bold">2</div>
              <span className="text-sm text-white font-medium">Personal details</span>
            </div>
            <div className="flex-1 h-px bg-white/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#4a7fa8] text-sm font-bold">3</div>
              <span className="text-sm text-[#4a7fa8]">Upload report</span>
            </div>
          </div>

          <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-white mb-2">Complete your profile</h1>
            <p className="text-[#4a7fa8] text-sm mb-6">
              Credit bureaus require this information to verify your identity and process disputes. All data is encrypted and stored securely.
            </p>

            {error && (
              <div className="bg-[#E63946]/10 border border-[#E63946]/30 text-[#E63946] rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="bg-[#2D6BE4]/10 border border-[#2D6BE4]/20 rounded-xl px-4 py-3 text-sm text-[#2D6BE4]">
                <strong>Security:</strong> Data is encrypted at rest and in transit. SSN is stored as last-4 only — never your full SSN.
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#E63946] hover:bg-[#c92e3a] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white"
              >
                {saving ? 'Saving...' : 'Save & continue to upload'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
