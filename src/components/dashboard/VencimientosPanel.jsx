import { memo, useEffect, useMemo, useState } from 'react'
import { Clock, CalendarClock, CircleAlert, Loader2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import StatCard from './StatCard'
import { formatFecha } from '../../lib/vencimientos'
import { clavePlataforma } from '../../lib/agruparCuentas'

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

const tipoBadge = {
  combo: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  usuario: 'bg-green-500/20 text-green-400 border-green-500/30',
  cuenta: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

const tipoLabel = {
  combo: 'Combo',
  usuario: 'Cliente',
  cuenta: 'Cuenta',
}

const ItemRow = memo(function ItemRow({ item }) {
  const meta = bucketMeta[item.bucket]
  const esCombo = item.tipo === 'combo'
  const plataformas = item.plataformas?.length
    ? item.plataformas.join(' · ')
    : item.plataforma

  return (
    <div
      className={`px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-colors ${
        esCombo ? 'bg-yellow-500/5 hover:bg-yellow-500/10' : 'hover:bg-gray-700/40'
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-white font-medium truncate">{item.nombre}</p>
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border ${
              tipoBadge[item.tipo] || tipoBadge.usuario
            }`}
          >
            {tipoLabel[item.tipo] || 'Cliente'}
          </span>
        </div>
        <p className="text-sm text-gray-400 truncate">
          {esCombo
            ? plataformas
            : item.tipo === 'usuario'
              ? `${item.correo}${item.plataforma ? ` · ${item.plataforma}` : ''}${item.telefono ? ` · ${item.telefono}` : ''}`
              : item.plataforma}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {!esCombo && item.pin ? (
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
  const [payload, setPayload] = useState({ items: [], counts: { hoy: 0, manana: 0, vencida: 0 } })
  const [filtro, setFiltro] = useState(null)

  useEffect(() => {
    request('/cuentas/vencimientos').then(({ data }) => {
      if (data) {
        setPayload({
          items: data.items || [],
          counts: data.counts || { hoy: 0, manana: 0, vencida: 0 },
        })
      }
    })
  }, [request])

  const items = payload.items
  const grupos = useMemo(() => {
    function organizar(lista) {
      const combos = lista
        .filter((i) => i.tipo === 'combo')
        .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
      const resto = lista.filter((i) => i.tipo !== 'combo')
      const ordenados = [...resto].sort((a, b) => {
        const plat = clavePlataforma(a.plataforma).localeCompare(clavePlataforma(b.plataforma), 'es')
        if (plat) return plat
        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es')
      })
      const map = new Map()
      for (const item of ordenados) {
        const nombre = item.plataforma || 'Sin plataforma'
        if (!map.has(nombre)) map.set(nombre, [])
        map.get(nombre).push(item)
      }
      return {
        combos,
        secciones: [...map.entries()].map(([plataforma, filas]) => ({ plataforma, filas })),
      }
    }

    return {
      hoy: organizar(items.filter((i) => i.bucket === 'hoy')),
      manana: organizar(items.filter((i) => i.bucket === 'manana')),
      vencida: organizar(items.filter((i) => i.bucket === 'vencida')),
    }
  }, [items])
  const counts = payload.counts

  function seleccionar(bucket) {
    setFiltro((prev) => (prev === bucket ? null : bucket))
  }

  const bucketsVisibles = filtro ? [filtro] : ['hoy', 'manana', 'vencida']
  const listaFiltrada = filtro
    ? [...grupos[filtro].combos, ...grupos[filtro].secciones.flatMap((s) => s.filas)]
    : items

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
          value={String(counts.manana)}
          color="yellow"
          selected={filtro === 'manana'}
          onClick={() => seleccionar('manana')}
          icon={<CalendarClock className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Vence hoy"
          value={String(counts.hoy)}
          color="indigo"
          selected={filtro === 'hoy'}
          onClick={() => seleccionar('hoy')}
          icon={<Clock className="h-6 w-6 text-white" />}
        />
        <StatCard
          title="Ya vencidas"
          value={String(counts.vencida)}
          color="red"
          selected={filtro === 'vencida'}
          onClick={() => seleccionar('vencida')}
          icon={<CircleAlert className="h-6 w-6 text-white" />}
        />
      </div>

      {loading && items.length === 0 ? (
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
          const grupo = grupos[bucket]
          const total = grupo.combos.length + grupo.secciones.reduce((n, s) => n + s.filas.length, 0)
          if (total === 0) return null
          return (
            <div key={bucket} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{bucketMeta[bucket].title}</h3>
                <span className="text-xs text-gray-500">{total}</span>
              </div>
              {grupo.combos.length > 0 && (
                <div className="border-b border-gray-700">
                  <div className="px-4 py-2 bg-yellow-500/10 text-xs font-semibold uppercase tracking-wide text-yellow-300">
                    Combos
                    <span className="ml-2 font-normal normal-case tracking-normal text-yellow-300/80">
                      {grupo.combos.length}
                    </span>
                  </div>
                  <div className="divide-y divide-yellow-500/10">
                    {grupo.combos.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
              {grupo.secciones.map((seccion) => (
                <div key={`${bucket}-${seccion.plataforma}`} className="border-b border-gray-700 last:border-b-0">
                  <div className="px-4 py-2 bg-gray-900/50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {seccion.plataforma}
                    <span className="ml-2 font-normal normal-case tracking-normal">{seccion.filas.length}</span>
                  </div>
                  <div className="divide-y divide-gray-700">
                    {seccion.filas.map((item) => (
                      <ItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}
