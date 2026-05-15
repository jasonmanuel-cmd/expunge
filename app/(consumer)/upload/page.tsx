'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

export default function UploadPage() {
  const router = useRouter()
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'processing'>('upload')
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reportText.trim()) return
    setLoading(true)
    setError('')
    setStep('processing')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setStatusMsg('Creating case...')
    const { data: newCase, error: caseError } = await supabase
      .from('cases')
      .insert({ user_id: user.id, credit_report_text: reportText, status: 'analyzing' })
      .select()
      .single()

    if (caseError || !newCase) {
      setError('Failed to create case. Please try again.')
      setStep('upload')
      setLoading(false)
      return
    }

    setStatusMsg('Running AI analysis — this may take 1-2 minutes...')

    const res = await fetch('/api/orchestrator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId: newCase.id, userId: user.id }),
    })

    if (!res.ok) {
      setError('Analysis failed. Please try again.')
      setStep('upload')
      setLoading(false)
      return
    }

    const result = await res.json()
    setStatusMsg(`Found ${result.itemCount} disputable items. Generating letters...`)

    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen bg-[#0D1B2E] text-white flex flex-col">
      <header className="border-b border-white/10 px-8 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {step === 'upload' ? (
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">Upload credit report</h1>
            <p className="text-[#4a7fa8] mb-8">
              Paste your credit report text below. We&apos;ll analyze it and identify all disputable items.
            </p>

            {error && (
              <div className="bg-[#E63946]/10 border border-[#E63946]/30 text-[#E63946] rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Credit report text</label>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  required
                  rows={16}
                  className="w-full bg-[#1A2E4A] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#4a7fa8] focus:outline-none focus:border-[#2D6BE4] transition font-mono text-sm resize-none"
                  placeholder="Paste your full credit report here (from AnnualCreditReport.com or your credit monitoring service)..."
                />
              </div>

              <div className="bg-[#2D6BE4]/10 border border-[#2D6BE4]/20 rounded-xl px-4 py-3 text-sm text-[#2D6BE4]">
                <strong>Privacy:</strong> Your report is analyzed and letters are generated immediately. Raw text is stored securely and used only for your dispute process.
              </div>

              <button
                type="submit"
                disabled={loading || !reportText.trim()}
                className="w-full bg-[#E63946] hover:bg-[#c92e3a] disabled:opacity-50 disabled:cursor-not-allowed transition py-4 rounded-xl font-bold text-lg text-white"
              >
                Analyze & start disputes
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#2D6BE4]/20 flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-[#2D6BE4] border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Analyzing your report</h2>
            <p className="text-[#4a7fa8] text-lg mb-4">{statusMsg}</p>
            <div className="text-[#4a7fa8] text-sm">
              Running Master Orchestrator → Case Router → Specialist Agents → Letter Bot
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
