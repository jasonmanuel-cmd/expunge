export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#6B7280]">Loading dispute details...</p>
      </div>
    </div>
  )
}
