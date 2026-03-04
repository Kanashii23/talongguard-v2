export default function Toast({ msg, type = 'success' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-medium text-white animate-fade-up
      ${type === 'success' ? 'bg-forest-800' : type === 'error' ? 'bg-red-600' : 'bg-gray-800'}
    `}>
      {msg}
    </div>
  )
}