import { puestoCortado, puestoPorCortar, resumenCorte } from '../../lib/vencimientos'

export function CorteBadgePuesto({ puesto }) {
  if (puestoCortado(puesto)) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-red-500/25 text-red-300 border-red-400/40">
        Quitar del perfil
      </span>
    )
  }
  if (puestoPorCortar(puesto)) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-red-500/25 text-red-300 border-red-400/40">
        Por cortar
      </span>
    )
  }
  return null
}

export default function CorteBadges({ puestos = [], cuenta = null }) {
  const { porCortar, cortados } = resumenCorte(puestos)
  const ocupados = Number(cuenta?.ocupados)
  const max = Number(cuenta?.max_puestos)
  const sobrecupo = Number.isFinite(ocupados) && Number.isFinite(max) && max > 0 && ocupados > max
  if (!porCortar && !cortados && !sobrecupo) return null
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {sobrecupo ? (
        <span
          className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border bg-amber-500/25 text-amber-200 border-amber-400/50"
          title="Hay más clientes que puestos. Falta cortar o eliminar a algún cliente de esta cuenta."
        >
          Pendiente cortar o eliminar · {ocupados}/{max}
        </span>
      ) : null}
      {porCortar > 0 ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border bg-red-500/25 text-red-300 border-red-400/50">
          Por cortar{porCortar > 1 ? ` · ${porCortar}` : ''}
        </span>
      ) : null}
      {cortados > 0 ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border bg-red-500/25 text-red-300 border-red-400/50">
          Quitar del perfil{cortados > 1 ? ` · ${cortados}` : ''}
        </span>
      ) : null}
    </span>
  )
}
