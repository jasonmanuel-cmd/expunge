'use client'
import { useState } from 'react'

interface Props {
  initialFirmName: string
  initialLogoUrl: string
  initialInviteCode: string | null
}

export default function FirmSettingsForm({ initialFirmName, initialLogoUrl, initialInviteCode }: Props) {
  const [firmName, setFirmName] = useState(initialFirmName)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl)
  const [inviteCode, setInviteCode] = useState(initialInviteCode)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const inviteLink = inviteCode && typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : inviteCode ? `/join/${inviteCode}` : ''

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    const res = await fetch('/api/partner/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firmName, logoUrl }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Could not save your firm settings.')
      return
    }
    setFirmName(data.firmName)
    setLogoUrl(data.logoUrl ?? '')
    setInviteCode(data.inviteCode)
    setMessage('Saved.')
  }

  async function copy() {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the link is still visible to copy by hand.
    }
  }

  const inputClass =
    'w-full bg-white border border-[#D1D5DB] rounded-lg px-4 py-3 text-[#111827] placeholder-[#9CA3AF] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] transition'

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-1">Your firm</h2>
      <p className="text-[#6B7280] text-sm mb-5">Clients see this name and logo when they join and on their dashboard.</p>

      {error && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] rounded-lg px-4 py-3 text-sm mb-4">{error}</div>
      )}

      <form onSubmit={save} className="space-y-4">
        <div>
          <label className="block text-sm text-[#374151] mb-1.5">Firm name</label>
          <input
            type="text"
            value={firmName}
            onChange={(e) => setFirmName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            className={inputClass}
            placeholder="Smith Tax Services"
          />
        </div>
        <div>
          <label className="block text-sm text-[#374151] mb-1.5">
            Logo URL <span className="text-[#9CA3AF] text-xs">(optional, must start with https://)</span>
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className={inputClass}
            placeholder="https://yourfirm.com/logo.png"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 transition px-5 py-2.5 rounded-lg text-sm font-bold text-white"
          >
            {saving ? 'Saving...' : inviteCode ? 'Save' : 'Save and create invite link'}
          </button>
          {message && <span className="text-sm text-[#16A34A]">{message}</span>}
        </div>
      </form>

      {inviteCode && (
        <div className="mt-6 pt-5 border-t border-[#E5E7EB]">
          <div className="text-sm font-semibold mb-1">Client invite link</div>
          <p className="text-[#6B7280] text-sm mb-3">Send this to your clients. Anyone who signs up with it is added to your roster.</p>
          <div className="flex gap-2">
            <input readOnly value={inviteLink} className={`${inputClass} text-sm`} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              onClick={copy}
              className="border border-[#D1D5DB] hover:border-[#F97316] transition px-4 rounded-lg text-sm font-medium whitespace-nowrap"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
