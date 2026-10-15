import { memo, useEffect, useMemo, useState } from 'react'
import { Clock, CalendarClock, CircleAlert, Loader2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import StatCard from './StatCard'
import { buildVencimientoItems, formatFecha } from '../../lib/vencimientos'

const bucketMeta = {
  manana: {
    title: 'Vence mañana',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  hoy: {
    title: 'Vence hoy',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  vencida: {
    title: 'Ya vencida',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

const ItemRow = memo(function ItemRow({ item }) {
  const meta = bucketMeta[item.bucket]
  return (
    <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-700/40 transition-colors">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-white font-medium truncate">{item.nombre}</p>
          <span className="text-[11px] uppercase tracking-wide text-gray-500">
            {item.tipo === 'usuario' ? 'Cliente' : 'Cuenta'}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate">
          {item.tipo === 'usuario' ? item.correo : item.plataforma}
          {item.plataforma && item.tipo === 'usuario' ? ` · ${item.plataforma}` : ''}
          {item.telefono ? ` · ${item.telefono}` : ''}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {item.pin ? (
          <span className="text-xs font-mono text-gray-400">PIN {item.pin}</span>
        ) : null}
        <span className="text-xs text-gray-400">{formatFecha(item.fecha)}</span>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${meta.badge}`}>
          {meta.title}
        </span>
      </div>
    </div>
  )
})

export default function VencimientosPanel() {
  const { request, loading } = useApi()
  const [cuentas, setCuentas] = useState([])
  const [filtro, setFiltro] = useState(null)

  useEffect(() => {
    request('/cuentas').then(({ data }) => {
      if (data) setCuentas(data)
    })
  }, [request])

  const items = useMemo(() => buildVencimientoItems(cuentas), [cuentas])
  const grupos = useMemo(() => ({
    hoy: items.filter((i) => i.bucket === 'hoy'),
    manana: items.filter((i) => i.bucket === 'manana'),
    vencida: items.filter((i) => i.bucket === 'vencida'),
  }), [items])
  const { hoy, manana, vencida: vencidas } = grupos

  function seleccionar(bucket) {
    setFiltro((prev) => (prev === bucket ? null : bucket))
  }

  const bucketsVisibles = filtro ? [filtro] : ['hoy', 'manana', 'vencida']
  const listaFiltrada = filtro ? grupos[filtro] : items

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Dashboard</h2>
        <p className="text-sm text-gray-400 mt-1">
          Toca una tarjeta para ver solo esos vencimientos. Vuelve a tocarla para ver todos.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Vence mañana"
          value={String(manana.length)}
          color="yellow"
          selected={filtro === 'manana'}
          onClick={() => seleccionar('manana')}
          icon={<CalendarClock className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Vence hoy"
          value={String(hoy.length)}
          color="indigo"
          selected={filtro === 'hoy'}
          onClick={() => seleccionar('hoy')}
          icon={<Clock className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Ya vencidas"
          value={String(vencidas.length)}
          color="red"
          selected={filtro === 'vencida'}
          onClick={() => seleccionar('vencida')}
          icon={<CircleAlert className="h-6 w-6 text-white" />}
        />
      </div>

      {loading && cuentas.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">No hay vencimientos de mañana, de hoy ni vencidos</p>
        </div>
      ) : listaFiltrada.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">No hay registros en {bucketMeta[filtro]?.title?.toLowerCase()}</p>
        </div>
      ) : (
        bucketsVisibles.map((bucket) => {
          const group = grupos[bucket]
          if (group.length === 0) return null
          return (
            <div key={bucket} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{bucketMeta[bucket].title}</h3>
                <span className="text-xs text-gray-500">{group.length}</span>
              </div>
              <div className="divide-y divide-gray-700">
                {group.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
