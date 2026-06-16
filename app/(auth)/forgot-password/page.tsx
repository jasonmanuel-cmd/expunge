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
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`

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
      <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} />
            </Link>
          </div>
          <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-[#4a7fa8] text-sm mb-6">
              We sent a password reset link to <strong className="text-white">{email}</strong>.
              Click the link in the email to set a new password.
            </p>
            <div className="bg-[#2D6BE4]/10 border border-[#2D6BE4]/20 rounded-xl px-4 py-3 text-sm text-[#2D6BE4] mb-4">
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <button onClick={() => setSent(false)} className="underline hover:text-white">
                try again
              </button>
            </div>
            <Link
              href="/login"
              className="text-[#2D6BE4] hover:text-[#4a7fa8] text-sm transition"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <ExpungeLogo variant="primary" width={200} height={50} />
          </Link>
        </div>

        <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
          <p className="text-[#4a7fa8] text-sm mb-6">
            No worries — enter your email and we&apos;ll send you a reset link.
          </p>

          {error && (
            <div className="bg-[#E63946]/10 border border-[#E63946]/30 text-[#E63946] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E63946] hover:bg-[#c92e3a] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <p className="text-center text-[#4a7fa8] text-sm mt-6">
            Remember your password?{' '}
            <Link href="/login" className="text-[#2D6BE4] hover:text-[#4a7fa8] transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
