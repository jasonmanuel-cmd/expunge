'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelButton() {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCancel() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/square/cancel-subscription', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Cancellation failed.')
      setLoading(false)
      return
    }
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full text-center border border-[#E63946]/30 text-[#E63946] hover:bg-[#E63946]/10 py-3.5 rounded-xl transition text-sm font-medium"
      >
        Cancel subscription
      </button>
    )
  }

  return (
    <div className="bg-[#E63946]/5 border border-[#E63946]/20 rounded-xl p-5">
      <p className="text-sm text-slate-300 mb-4">
        Are you sure? Your plan stays active until the end of the billing period.
      </p>
      {error && <p className="text-[#E63946] text-sm mb-3">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 border border-white/20 py-2.5 rounded-lg text-sm hover:bg-white/5 transition"
        >
          Keep plan
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex-1 bg-[#E63946]/20 border border-[#E63946]/40 text-[#E63946] py-2.5 rounded-lg text-sm hover:bg-[#E63946]/30 disabled:opacity-50 transition"
        >
          {loading ? 'Canceling...' : 'Yes, cancel'}
        </button>
      </div>
    </div>
  )
}
