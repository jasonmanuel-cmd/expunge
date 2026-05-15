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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push(role === 'partner' ? '/partner/dashboard' : '/dashboard')
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
