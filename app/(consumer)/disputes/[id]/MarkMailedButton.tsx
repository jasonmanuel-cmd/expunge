'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MarkMailedButton({ letterId, sentAt }: { letterId: string; sentAt?: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (sentAt) {
    return (
      <span className="text-xs text-[#16A34A]">
        You mailed this on {new Date(sentAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    )
  }

  async function markMailed() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/letters/${letterId}/mark-sent`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not save')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={markMailed}
        disabled={busy}
        className="text-xs border border-[#D1D5DB] text-[#374151] bg-white px-3 py-1 rounded-full hover:bg-[#F9FAFB] disabled:opacity-50 transition"
      >
        {busy ? 'Saving…' : 'I mailed this'}
      </button>
      <span className="text-xs text-[#6B7280]">Not mailed yet</span>
      {error && <span className="text-xs text-[#E63946]">{error}</span>}
    </span>
  )
}
