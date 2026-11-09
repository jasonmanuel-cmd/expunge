'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RESULTS: Array<{ value: string; label: string }> = [
  { value: 'removed', label: 'Removed' },
  { value: 'modified', label: 'Updated' },
  { value: 'verified', label: 'Stayed the same' },
  { value: 'no_response', label: 'No reply in 30 days' },
]

/** Lets the consumer record what the bureau did after they mailed a letter. */
export function RecordOutcome({ dispatchRecordId }: { dispatchRecordId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function record(result: string) {
    setBusy(result)
    setError(null)
    try {
      const res = await fetch('/api/outcome-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispatchRecordId, result }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Could not save')
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-xs text-[#6B7280]">Bureau result:</span>
      {RESULTS.map((r) => (
        <button
          key={r.value}
          type="button"
          disabled={busy !== null}
          onClick={() => record(r.value)}
          className="text-xs border border-[#D1D5DB] text-[#374151] bg-white px-3 py-1 rounded-full hover:bg-[#F9FAFB] disabled:opacity-50 transition"
        >
          {busy === r.value ? 'Saving…' : r.label}
        </button>
      ))}
      {error && <span className="text-xs text-[#E63946]">{error}</span>}
    </div>
  )
}

/** Drafts a round-2 letter and CFPB complaint for an item the bureau ignored or verified. */
export function EscalateButton({ disputeItemId }: { disputeItemId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function escalate() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeItemId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Could not draft the round 2 letter')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draft the round 2 letter')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2 mb-3">
      <button
        type="button"
        onClick={escalate}
        disabled={busy}
        className="text-xs bg-[#F97316] text-white px-3 py-1.5 rounded-full hover:bg-[#EA580C] disabled:opacity-50 transition"
      >
        {busy ? 'Drafting…' : 'Draft round 2 letter + CFPB complaint'}
      </button>
      {error && <span className="text-xs text-[#E63946]">{error}</span>}
    </div>
  )
}
