import { memo } from 'react'

const COLORS = {
  indigo: 'bg-indigo-600',
  green: 'bg-green-600',
  red: 'bg-red-600',
  yellow: 'bg-yellow-600',
}

const SELECTED_RING = {
  indigo: 'border-indigo-500 ring-2 ring-indigo-500/40',
  green: 'border-green-500 ring-2 ring-green-500/40',
  red: 'border-red-500 ring-2 ring-red-500/40',
  yellow: 'border-yellow-500 ring-2 ring-yellow-500/40',
}

function StatCard({ title, value, icon, color = 'indigo', onClick, selected = false }) {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        bg-gray-800 rounded-xl p-4 sm:p-5 border text-left w-full
        ${selected ? SELECTED_RING[color] || SELECTED_RING.indigo : 'border-gray-700'}
        ${onClick ? 'cursor-pointer hover:border-gray-500 transition-colors' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-400 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`h-11 w-11 shrink-0 ${COLORS[color] || COLORS.indigo} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </Wrapper>
  )
}

export default memo(StatCard)
