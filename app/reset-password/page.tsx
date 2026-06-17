'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Supabase sends the user back with a session from the email link
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // No valid session — the link may be expired or invalid
        setError('This password reset link is invalid or has expired. Please request a new one.')
      }
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} light />
            </Link>
          </div>
          <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4 text-[#27AE60]">✓</div>
            <h1 className="text-2xl font-bold text-white mb-2">Password updated!</h1>
            <p className="text-[#4a7fa8] text-sm mb-6">
              Your password has been changed successfully.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#E63946] hover:bg-[#c92e3a] transition px-8 py-3 rounded-lg font-bold text-white"
            >
              Sign in with new password
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-[#0D1B2E] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#2D6BE4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#4a7fa8]">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/">
            <ExpungeLogo variant="primary" width={200} height={50} light />
          </Link>
        </div>

        <div className="bg-[#1A2E4A] border border-white/10 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
          <p className="text-[#4a7fa8] text-sm mb-6">
            Enter your new password below.
          </p>

          {error && (
            <div className="bg-[#E63946]/10 border border-[#E63946]/30 text-[#E63946] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">New password</label>
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
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-[#0D1B2E] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition"
                placeholder="Re-enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E63946] hover:bg-[#c92e3a] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <p className="text-center text-[#4a7fa8] text-sm mt-6">
            <Link href="/login" className="text-[#2D6BE4] hover:text-[#4a7fa8] transition">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
