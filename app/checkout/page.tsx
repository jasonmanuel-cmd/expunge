'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/square/client'
import Link from 'next/link'
import ExpungeLogo from '@/components/ExpungeLogo'

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<{
        card: () => Promise<{
          attach: (selector: string) => Promise<void>
          tokenize: () => Promise<{ status: string; token?: string; errors?: { message: string }[] }>
        }>
      }>
    }
  }
}

function CheckoutInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planKey = (searchParams.get('plan') ?? 'pro') as keyof typeof PLANS
  const plan = PLANS[planKey] ?? PLANS.pro

  const [loading, setLoading] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [cardInstance, setCardInstance] = useState<Awaited<ReturnType<Awaited<ReturnType<NonNullable<typeof window.Square>['payments']>>['card']>> | null>(null)

  useEffect(() => {
    const script = document.createElement('script')
    const env = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === 'production'
      ? 'https://web.squarecdn.com/v1/square.js'
      : 'https://sandbox.web.squarecdn.com/v1/square.js'
    script.src = env
    script.onload = async () => {
      if (!window.Square) return
      try {
        const payments = await window.Square.payments(
          process.env.NEXT_PUBLIC_SQUARE_APP_ID!,
          process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!
        )
        const card = await payments.card()
        await card.attach('#card-container')
        setCardInstance(card)
        setSdkReady(true)
      } catch (e) {
        setError('Failed to load payment form. Please refresh.')
        console.error(e)
      }
    }
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cardInstance) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const result = await cardInstance.tokenize()
    if (result.status !== 'OK' || !result.token) {
      setError(result.errors?.[0]?.message ?? 'Card tokenization failed.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/square/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planKey, sourceId: result.token, userId: user.id, email: user.email }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Payment failed. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-[#16A34A]">✓</div>
          <h1 className="text-3xl font-bold mb-2 text-[#16A34A]">You&apos;re on {plan.name}!</h1>
          <p className="text-[#6B7280]">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <Link href="/" className="flex items-center gap-3 mb-8 justify-center">
          <ExpungeLogo variant="primary" width={200} height={50} />
        </Link>

        <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl p-8">
          {/* Plan summary */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-[#E5E7EB]">
            <div>
              <div className="font-semibold text-lg">{plan.name} Plan</div>
              <div className="text-[#6B7280] text-sm">{plan.description}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#F97316]">{plan.priceLabel}</div>
              <div className="text-[#6B7280] text-xs">billed monthly</div>
            </div>
          </div>

          {/* Features recap */}
          <ul className="space-y-2 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
                <span className="text-[#16A34A]">✓</span> {f}
              </li>
            ))}
          </ul>

          {error && (
            <div className="bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] rounded-lg px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block text-sm text-[#374151] mb-2">Card details</label>
              <div
                id="card-container"
                className="bg-[#F5F5F7] border border-[#E5E7EB] rounded-xl p-4 min-h-[56px]"
                style={{ colorScheme: 'dark' }}
              />
              {!sdkReady && (
                <div className="text-xs text-[#6B7280] mt-2 text-center">Loading secure payment form...</div>
              )}
            </div>

            <div className="bg-[#F5F5F7] rounded-xl p-4 mb-5 text-xs text-[#6B7280] flex items-start gap-2">
              <span className="mt-0.5">🔒</span>
              <span>Payments processed securely by Square. Your card details never touch our servers.</span>
            </div>

            <button
              type="submit"
              disabled={loading || !sdkReady}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-4 rounded-xl font-bold text-lg text-white"
            >
              {loading ? 'Processing payment...' : `Subscribe — ${plan.priceLabel}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F5F7]" />}>
      <CheckoutInner />
    </Suspense>
  )
}
