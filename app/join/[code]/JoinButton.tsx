'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinButton({ code, firmName }: { code: string; firmName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function join() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/partner/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? 'Could not link your account.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div>
      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}
      <button
        type="button"
        onClick={join}
        disabled={loading}
        className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition py-3 rounded-lg font-bold text-white shadow-md shadow-orange-200"
      >
        {loading ? 'Linking...' : `Link my account to ${firmName}`}
      </button>
    </div>
  )
}
