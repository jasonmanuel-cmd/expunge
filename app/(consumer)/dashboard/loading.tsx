export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0D1B2E] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#2D6BE4] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#4a7fa8]">Loading dashboard...</p>
      </div>
    </div>
  )
}
