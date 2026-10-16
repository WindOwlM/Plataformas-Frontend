import { bucketMeta, classifyFecha, formatFecha } from '../../lib/vencimientos'

export default function FechaBadge({ fecha, empty = '—' }) {
  if (!fecha) return <span className="text-gray-500">{empty}</span>
  const bucket = classifyFecha(fecha)
  const texto = formatFecha(fecha)
  if (!bucket) return <span className="text-gray-300 whitespace-nowrap">{texto}</span>
  const meta = bucketMeta[bucket]
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${meta.badge}`}
      title={meta.title}
    >
      {texto}
    </span>
  )
}
