'use client'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-[#111827] mb-2">Something went wrong</h2>
        <p className="text-[#6B7280] mb-6">Failed to load dispute details. Please try again.</p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="bg-[#F97316] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#EA580C] transition"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="text-[#6B7280] hover:text-[#111827] transition text-sm"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
