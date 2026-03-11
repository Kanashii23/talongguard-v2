export default function Toast({ msg, type = 'success' }) {
  const colors = {
    success: 'bg-gray-900 text-white border-gray-700',
    error: 'bg-red-600 text-white border-red-500',
    info: 'bg-blue-600 text-white border-blue-500',
  }
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-2.5 px-5 py-3 rounded-2xl border shadow-2xl text-sm font-semibold animate-fade-up whitespace-nowrap ${colors[type] || colors.success}`}
    >
      {msg}
    </div>
  )
}
