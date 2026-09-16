export default function StatCard({ title, value, icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    yellow: 'bg-yellow-600',
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`h-12 w-12 ${colors[color]} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  )
}