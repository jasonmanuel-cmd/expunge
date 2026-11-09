'use client'

import { useState } from 'react'

/**
 * Demo request form. It sends nothing from the site: on submit it opens the
 * visitor's own email app with the details filled in, addressed to `to`.
 * Swap this for a stored lead (Supabase table + API route) when one exists.
 */
export default function DemoRequestForm({ to }: { to: string }) {
  const [opened, setOpened] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const get = (k: string) => String(f.get(k) ?? '').trim()
    const subject = `Demo request: ${get('firm') || 'firm'}`
    const body = [
      `Name: ${get('name')}`,
      `Firm: ${get('firm')}`,
      `Email: ${get('email')}`,
      `Phone: ${get('phone')}`,
      `Firm type: ${get('type')}`,
      `Clients per year: ${get('clients')}`,
      '',
      get('message'),
    ].join('\n')
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setOpened(true)
  }

  const input =
    'mt-1.5 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0D1B2E] placeholder:text-[#A39E98] outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-[#F97316]/15'
  const label = 'block text-sm font-medium text-[#374151]'

  return (
    <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <label className={label}>
        Your name
        <input name="name" required autoComplete="name" className={input} placeholder="Jordan Lee" />
      </label>
      <label className={label}>
        Firm name
        <input name="firm" required autoComplete="organization" className={input} placeholder="Lee Tax Services" />
      </label>
      <label className={label}>
        Work email
        <input name="email" type="email" required autoComplete="email" className={input} placeholder="you@yourfirm.com" />
      </label>
      <label className={label}>
        Phone <span className="text-[#A39E98] font-normal">(optional)</span>
        <input name="phone" type="tel" autoComplete="tel" className={input} />
      </label>
      <label className={label}>
        Firm type
        <select name="type" className={input} defaultValue="Tax preparation">
          <option>Tax preparation</option>
          <option>Bookkeeping or CPA</option>
          <option>Mortgage or lending</option>
          <option>Financial coaching</option>
          <option>Other</option>
        </select>
      </label>
      <label className={label}>
        Clients per year
        <select name="clients" className={input} defaultValue="Under 100">
          <option>Under 100</option>
          <option>100 to 500</option>
          <option>500 to 2,000</option>
          <option>Over 2,000</option>
        </select>
      </label>
      <label className={`${label} sm:col-span-2`}>
        Anything we should know? <span className="text-[#A39E98] font-normal">(optional)</span>
        <textarea name="message" rows={3} className={input} />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="w-full rounded-xl bg-[#F97316] hover:bg-[#EA580C] py-3.5 text-sm font-bold text-white transition-colors shadow-[0_8px_24px_rgba(249,115,22,0.3)]"
        >
          Request a demo
        </button>
        <p className="mt-3 text-xs text-[#8A847E]">
          {opened
            ? `Your email app should have opened with your request. If it didn't, email ${to}.`
            : 'This opens your email app with your details filled in, so you can review it before you send.'}
        </p>
      </div>
    </form>
  )
}
