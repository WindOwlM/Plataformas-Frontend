import { formatFecha, formatSaldo } from '../../lib/vencimientos'

// Etiqueta "Debe $X" para clientes con fiado pendiente
export default function EtiquetaDebe({ deuda }) {
  if (!deuda?.total) return null
  const veces = deuda.cantidad > 1 ? ` (${deuda.cantidad} fiados)` : ''
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-amber-500/20 text-amber-200 border-amber-500/50 whitespace-nowrap"
      title={`Fiado pendiente desde ${formatFecha(deuda.desde)}${veces}. Se marca como pagado en Reportes.`}
    >
      Debe {formatSaldo(deuda.total)}
    </span>
  )
}
