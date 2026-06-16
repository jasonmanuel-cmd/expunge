'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-2">Failed to load dashboard</h2>
        <p className="text-[#4a7fa8] mb-6">Something went wrong. Please try again.</p>
        <button
          onClick={reset}
          className="bg-[#2D6BE4] text-white px-6 py-2 rounded-xl text-sm hover:bg-[#1f4fa8] transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
