'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Frees a client seat. Two clicks: the first asks, the second removes. The
 * client keeps their account and past letters but is no longer covered by
 * the firm.
 */
export default function RemoveClientButton({ consumerId, name }: { consumerId: string; name: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/partner/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumerId }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not remove this client.')
      return
    }
    setConfirming(false)
    router.refresh()
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-[#6B7280] hover:text-[#DC2626] transition"
      >
        Remove
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {error && <span className="text-[#DC2626]">{error}</span>}
      <button
        type="button"
        onClick={remove}
        disabled={loading}
        aria-label={`Remove ${name} and free their seat`}
        className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition"
      >
        {loading ? 'Removing...' : 'Remove client'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={loading}
        className="text-[#6B7280] hover:text-[#111827] transition"
      >
        Keep
      </button>
    </div>
  )
}
