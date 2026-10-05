export default function StatCard({ title, value, icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-5 border border-gray-700">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`h-11 w-11 shrink-0 ${colors[color] || colors.indigo} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
