'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsConfirm(false)
    setResent(false)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      if (authError.message.toLowerCase().includes('not confirmed')) {
        setNeedsConfirm(true)
      }
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleResend() {
    setResent(false)
    const supabase = createClient()
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback/` },
    })
    if (resendError) {
      setError(resendError.message)
      return
    }
    setResent(true)
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
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Sign in</h1>
          <p className="text-[#6B7280] text-sm mb-6">Access your dispute dashboard</p>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {needsConfirm && (
            <div className="bg-[#FFF7ED] border border-[#FED7AA] text-[#9A3412] rounded-lg px-4 py-3 text-sm mb-4">
              {resent ? (
                <span>Confirmation email resent. Check your inbox.</span>
              ) : (
                <>
                  Your email isn&apos;t confirmed yet.{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#F97316] hover:text-[#EA580C] underline transition font-medium"
                  >
                    Resend confirmation email
                  </button>
                </>
              )}
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
            <div>
              <label className="block text-sm text-[#374151] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            No account?{' '}
            <Link href="/register" className="text-[#F97316] hover:text-[#EA580C] transition font-medium">
              Create one
            </Link>
          </p>

          <p className="text-center text-[#6B7280] text-sm mt-3">
            <Link href="/forgot-password" className="text-[#F97316] hover:text-[#EA580C] transition font-medium">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
