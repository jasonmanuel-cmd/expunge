'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const redirectUrl = `${window.location.origin}/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} />
            </Link>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-[#111827] mb-2">Check your email</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              We sent a password reset link to <strong className="text-[#111827]">{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl px-4 py-3 text-sm text-[#9A3412] mb-4">
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <button onClick={() => setSent(false)} className="underline hover:text-[#EA580C] font-medium">
                try again
              </button>
            </div>
            <Link
              href="/login"
              className="text-[#F97316] hover:text-[#EA580C] text-sm transition font-medium"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <ExpungeLogo variant="primary" width={200} height={50} />
          </Link>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Forgot password?</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            No worries — enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#374151] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-[#F97316] hover:text-[#EA580C] transition font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
