import { formatSaldo } from '../../lib/vencimientos'

// Etiqueta "A favor $X" para clientes con saldo a favor
export default function EtiquetaSaldo({ deuda }) {
  if (!deuda?.saldo) return null
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-emerald-500/15 text-emerald-200 border-emerald-500/50 whitespace-nowrap"
      title="Saldo a favor del cliente. Se puede usar al renovar."
    >
      A favor {formatSaldo(deuda.saldo)}
    </span>
  )
}
