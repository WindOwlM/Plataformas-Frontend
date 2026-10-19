import { puestoCortado, puestoPorCortar, resumenCorte } from '../../lib/vencimientos'

export function CorteBadgePuesto({ puesto }) {
  if (puestoCortado(puesto)) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border bg-slate-500/25 text-slate-200 border-slate-400/40">
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

export default function CorteBadges({ puestos = [] }) {
  const { porCortar, cortados } = resumenCorte(puestos)
  if (!porCortar && !cortados) return null
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      {porCortar > 0 ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border bg-red-500/25 text-red-300 border-red-400/50">
          Por cortar{porCortar > 1 ? ` · ${porCortar}` : ''}
        </span>
      ) : null}
      {cortados > 0 ? (
        <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border bg-slate-500/25 text-slate-200 border-slate-400/40">
          Quitar del perfil{cortados > 1 ? ` · ${cortados}` : ''}
        </span>
      ) : null}
    </span>
  )
}
