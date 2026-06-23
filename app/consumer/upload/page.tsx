'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExpungeLogo from '@/components/ExpungeLogo'

type UploadMode = 'file' | 'paste'
type Step = 'upload' | 'processing' | 'done'

export default function UploadPage() {
  const router = useRouter()
  const [mode, setMode] = useState<UploadMode>('file')
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('upload')
  const [statusMsg, setStatusMsg] = useState('')
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('address_line1, city, state, zip_code, ssn_last4, date_of_birth')
        .eq('id', user.id)
        .single()
      const complete = !!(
        profile?.address_line1 && profile?.city && profile?.state &&
        profile?.zip_code && profile?.ssn_last4 && profile?.date_of_birth
      )
      setProfileComplete(complete)
    })
  }, [router])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File | null) => {
    if (!file) return
    setFileName(file.name)
    setError('')

    // If it's a text file, read it directly
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setReportText(text)
      }
      reader.readAsText(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  async function handleFileUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    setLoading(true)
    setError('')
    setStep('processing')
    setStatusMsg('Uploading file...')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)

    try {
      const res = await fetch('/api/upload-report', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Upload failed. Please try again.')
        setStep('upload')
        setLoading(false)
        return
      }

      setStatusMsg(`File uploaded! Extracted ${result.textLength} characters. Starting AI analysis...`)

      // Run orchestrator
      const orchRes = await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: result.caseId, userId: user.id }),
      })

      if (!orchRes.ok) {
        setError('Analysis failed. Please try again.')
        setStep('upload')
        setLoading(false)
        return
      }

      const orchResult = await orchRes.json()
      setStatusMsg(`Found ${orchResult.itemCount} disputable items. Generating letters...`)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch {
      setError('Upload failed. Please check your connection and try again.')
      setStep('upload')
      setLoading(false)
    }
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reportText.trim()) return
    setLoading(true)
    setError('')
    setStep('processing')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setStatusMsg('Creating case...')

    try {
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
    } catch {
      setError('Analysis failed. Please try again.')
      setStep('upload')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#111827] flex flex-col">
      <header className="border-b border-[#E5E7EB] px-8 py-4 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <ExpungeLogo variant="primary" width={160} height={40} />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {step === 'upload' ? (
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">Upload credit report</h1>
            <p className="text-[#6B7280] mb-6">
              Upload your credit report file or paste the text below. We&apos;ll analyze it and identify all disputable items.
            </p>

            {/* Profile completion banner */}
            {profileComplete === false && (
              <div className="bg-[#F97316]/10 border border-[#F97316]/30 rounded-xl px-4 py-3 text-sm mb-6 flex items-center justify-between">
                <span className="text-[#F97316]">
                  <strong>Action required:</strong> Please complete your profile before uploading. We need your address and date of birth to generate dispute letters.
                </span>
                <Link
                  href="/consumer/profile/step2"
                  className="bg-[#F97316] hover:bg-[#EA580C] text-white px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ml-4"
                >
                  Complete profile
                </Link>
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode('file')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                  mode === 'file'
                    ? 'bg-[#F97316] text-white'
                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
              >
                📎 Upload file
              </button>
              <button
                type="button"
                onClick={() => setMode('paste')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                  mode === 'paste'
                    ? 'bg-[#F97316] text-white'
                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#F3F4F6]'
                }`}
              >
                📝 Paste text
              </button>
            </div>

            {error && (
              <div className="bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] rounded-lg px-4 py-3 text-sm mb-4">
                {error}
              </div>
            )}

            {mode === 'file' ? (
              <form onSubmit={handleFileUpload} className="space-y-4">
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                    dragOver
                      ? 'border-[#F97316] bg-[#F97316]/10'
                      : 'border-white/20 hover:border-white/40 bg-[#FFFFFF]/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.csv,.json,.docx,.doc,.png,.jpg,.jpeg,.tiff"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="text-4xl mb-3">📄</div>
                  {fileName ? (
                    <>
                      <p className="text-[#111827] font-semibold mb-1">{fileName}</p>
                      <p className="text-[#6B7280] text-sm">Click or drop to change file</p>
                    </>
                  ) : (
                    <>
                      <p className="text-[#111827] font-semibold mb-1">Drop your file here or click to browse</p>
                      <p className="text-[#6B7280] text-sm">Supports PDF, TXT, CSV, JSON, DOCX, PNG, JPG, TIFF (max 25MB)</p>
                    </>
                  )}
                </div>

                {/* Supported formats */}
                <div className="flex flex-wrap gap-2">
                  {['PDF', 'TXT', 'CSV', 'JSON', 'DOCX', 'PNG', 'JPG', 'TIFF'].map(fmt => (
                    <span key={fmt} className="text-xs bg-[#F3F4F6] text-[#6B7280] px-2 py-1 rounded">{fmt}</span>
                  ))}
                </div>

                <div className="bg-[#F97316]/10 border border-[#F97316]/20 rounded-xl px-4 py-3 text-sm text-[#F97316]">
                  <strong>Privacy:</strong> Your report is analyzed and letters are generated immediately. Raw text is stored securely and used only for your dispute process.
                </div>

                <button
                  type="submit"
                  disabled={loading || (!fileName && !reportText.trim())}
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-4 rounded-xl font-bold text-lg text-white"
                >
                  {fileName ? `Upload ${fileName} & start disputes` : 'Select a file to continue'}
                </button>

                <p className="text-center text-[#6B7280] text-sm">
                  Prefer to paste?{' '}
                  <button type="button" onClick={() => setMode('paste')} className="text-[#F97316] hover:underline">
                    Switch to text paste
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={handlePasteSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#374151] mb-1.5">Credit report text</label>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    required
                    rows={16}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-3 text-white placeholder-[#6B7280] focus:outline-none focus:border-[#F97316] transition font-mono text-sm resize-none"
                    placeholder="Paste your full credit report here (from AnnualCreditReport.com or your credit monitoring service)..."
                  />
                  <p className="text-[#6B7280] text-xs mt-1">{reportText.length.toLocaleString()} characters</p>
                </div>

                <div className="bg-[#F97316]/10 border border-[#F97316]/20 rounded-xl px-4 py-3 text-sm text-[#F97316]">
                  <strong>Privacy:</strong> Your report is analyzed and letters are generated immediately. Raw text is stored securely and used only for your dispute process.
                </div>

                <button
                  type="submit"
                  disabled={loading || !reportText.trim()}
                  className="w-full bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition py-4 rounded-xl font-bold text-lg text-white"
                >
                  Analyze & start disputes
                </button>

                <p className="text-center text-[#6B7280] text-sm">
                  Have a file instead?{' '}
                  <button type="button" onClick={() => setMode('file')} className="text-[#F97316] hover:underline">
                    Switch to file upload
                  </button>
                </p>
              </form>
            )}
          </div>
        ) : (
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-[#F97316]/20 flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Analyzing your report</h2>
            <p className="text-[#6B7280] text-lg mb-4">{statusMsg}</p>
            <div className="text-[#6B7280] text-sm">
              Running Master Orchestrator → Case Router → Specialist Agents → Letter Bot
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
