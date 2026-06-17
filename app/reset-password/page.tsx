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
      <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-10 flex justify-center">
            <Link href="/">
              <ExpungeLogo variant="primary" width={200} height={50} />
            </Link>
          </div>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4 text-[#16A34A]">✓</div>
            <h1 className="text-2xl font-bold text-[#111827] mb-2">Password updated!</h1>
            <p className="text-[#6B7280] text-sm mb-6">
              Your password has been changed successfully.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#F97316] hover:bg-[#EA580C] transition px-8 py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
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
      <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#6B7280]">Verifying reset link...</p>
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
          <h1 className="text-2xl font-bold text-[#111827] mb-2">Set new password</h1>
          <p className="text-[#6B7280] text-sm mb-6">
            Enter your new password below.
          </p>

          {error && (
            <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#374151] mb-1.5">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm text-[#374151] mb-1.5">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition"
                placeholder="Re-enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-sm mt-6">
            <Link href="/login" className="text-[#F97316] hover:text-[#EA580C] transition font-medium">
              ← Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
