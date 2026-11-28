import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, Wallet, Users, Receipt } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import StatCard from '../components/dashboard/StatCard'
import { formatSaldo } from '../lib/vencimientos'
import PagosPanel from '../components/reportes/PagosPanel'

// Reporte solo de lectura: cuánto debería entrar y salir según los datos actuales.

function mesActual() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function moverMes(mes, delta) {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nombreMes(mes) {
  const [y, m] = mes.split('-').map(Number)
  const texto = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function diaCorto(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

function porcentaje(parte, total) {
  if (!total) return 0
  return Math.round((parte / total) * 100)
}

function Seccion({ titulo, descripcion, children, accion }) {
  return (
    <section className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="px-4 sm:px-5 py-4 border-b border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold">{titulo}</h3>
          {descripcion ? <p className="text-sm text-gray-400 mt-0.5">{descripcion}</p> : null}
        </div>
        {accion}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

function Barra({ valor, max, color = 'bg-indigo-500' }) {
  const ancho = max > 0 ? Math.max(2, Math.round((valor / max) * 100)) : 0
  return (
    <div className="h-2 w-full rounded-full bg-gray-700/60 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
    </div>
  )
}

function Cifra({ titulo, valor, detalle, tono = 'text-white' }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3 min-w-0">
      <p className="text-sm text-gray-400">{titulo}</p>
      <p className={`text-2xl font-bold tabular-nums ${tono}`}>{valor}</p>
      {detalle ? <p className="text-xs text-gray-500 mt-0.5">{detalle}</p> : null}
    </div>
  )
}

export default function ReportesPage() {
  const { request } = useApi()
  const [mes, setMes] = useState(mesActual)
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let vigente = true
    setCargando(true)
    request(`/reportes/resumen?mes=${mes}`).then(({ data }) => {
      if (!vigente) return
      if (data) setDatos(data)
      setCargando(false)
    })
    return () => {
      vigente = false
    }
  }, [mes, request, version])

  if (!datos) {
    return (
      <div className="flex items-center gap-2 text-gray-400 py-10 justify-center">
        <Loader2 className="h-5 w-5 animate-spin" />
        Calculando…
      </div>
    )
  }

  const { general, vencidos, mes_detalle: detalle, plataformas, incompletos, hoy, real } = datos
  const esMesActual = mes === hoy.slice(0, 7)
  const esPasado = mes < hoy.slice(0, 7)
  const maxDia = Math.max(0, ...detalle.por_dia.map((d) => Math.max(d.cobro, d.pago)))
  const maxVenta = Math.max(0, ...plataformas.map((p) => p.venta))
  const margenGeneral = porcentaje(general.ganancia_mensual, general.venta_mensual)
  const hayIncompletos = incompletos.clientes_sin_precio.length + incompletos.cuentas_sin_costo.length > 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Reportes</h2>
          <p className="text-sm text-gray-400 mt-1">
            Las cifras esperadas salen de los precios y fechas que hay hoy en la app. Las reales, de los pagos
            guardados al renovar.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-1">
          <button
            type="button"
            onClick={() => setMes((m) => moverMes(m, -1))}
            className="p-2 rounded-lg text-gray-300 hover:bg-gray-700"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-white w-36 text-center tabular-nums">
            {cargando ? <Loader2 className="h-4 w-4 animate-spin inline" /> : nombreMes(mes)}
          </span>
          <button
            type="button"
            onClick={() => setMes((m) => moverMes(m, 1))}
            className="p-2 rounded-lg text-gray-300 hover:bg-gray-700"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <PagosPanel
        mes={mes}
        nombreMes={nombreMes(mes)}
        real={real}
        onCambio={() => setVersion((v) => v + 1)}
        Seccion={Seccion}
      />

      <h3 className="text-sm uppercase tracking-wide text-gray-500 pt-2">Esperado según los datos actuales</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Ventas al mes"
          value={formatSaldo(general.venta_mensual)}
          color="indigo"
          icon={<Receipt className="h-5 w-5 text-white" />}
        />
        <StatCard
          title="Costo de cuentas al mes"
          value={formatSaldo(general.costo_mensual)}
          color="red"
          icon={<Wallet className="h-5 w-5 text-white" />}
        />
        <StatCard
          title={`Ganancia estimada · ${margenGeneral}%`}
          value={formatSaldo(general.ganancia_mensual)}
          color="green"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
        />
        <StatCard
          title={`Clientes activos · ${general.perfiles} perfiles · ${general.cuentas} cuentas`}
          value={String(general.clientes)}
          color="yellow"
          icon={<Users className="h-5 w-5 text-white" />}
        />
      </div>

      <Seccion
        titulo={`Vencimientos de ${nombreMes(mes)}`}
        descripcion="Lo que te deberían pagar los clientes y lo que debes pagar a proveedores según las fechas de vencimiento."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Cifra
            titulo="Te deberían pagar"
            valor={formatSaldo(detalle.cobro)}
            detalle={`${detalle.clientes} cliente${detalle.clientes === 1 ? '' : 's'}`}
            tono="text-indigo-300"
          />
          <Cifra
            titulo="Debes pagar a proveedores"
            valor={formatSaldo(detalle.pago)}
            detalle={`${detalle.cuentas} cuenta${detalle.cuentas === 1 ? '' : 's'}`}
            tono="text-red-300"
          />
          <Cifra
            titulo="Diferencia"
            valor={formatSaldo(detalle.cobro - detalle.pago)}
            detalle={`${porcentaje(detalle.cobro - detalle.pago, detalle.cobro)}% de lo cobrado`}
            tono={detalle.cobro - detalle.pago >= 0 ? 'text-green-300' : 'text-red-300'}
          />
        </div>

        {esMesActual || esPasado ? (
          <p className="text-xs text-amber-200/90 mt-3">
            {esMesActual
              ? `Los clientes que ya renovaron este mes pasaron al mes siguiente, por eso aquí solo queda lo que falta: ${formatSaldo(detalle.cobro_por_venir)} por vencer y ${formatSaldo(detalle.cobro_pendiente)} vencido sin renovar.`
              : 'Este mes ya pasó: solo aparecen los que siguen con fecha vencida sin renovar. Lo que se renovó se movió a meses siguientes.'}
          </p>
        ) : null}

        {detalle.por_dia.length === 0 ? (
          <p className="text-sm text-gray-400 mt-4">No hay vencimientos en este mes.</p>
        ) : (
          <div className="mt-4">
            <div className="hidden sm:grid grid-cols-[8rem_1fr_1fr] gap-4 px-2 pb-2 text-xs uppercase tracking-wide text-gray-500">
              <span>Día</span>
              <span>Clientes que vencen</span>
              <span>Cuentas que vencen</span>
            </div>
            <ul className="divide-y divide-gray-700/70">
              {detalle.por_dia.map((d) => (
                <li
                  key={d.fecha}
                  className={`grid grid-cols-1 sm:grid-cols-[8rem_1fr_1fr] gap-x-4 gap-y-2 px-2 py-2.5 ${
                    d.fecha === hoy ? 'bg-indigo-500/10 rounded-lg' : ''
                  } ${d.fecha < hoy ? 'opacity-70' : ''}`}
                >
                  <span className="text-sm text-gray-200 capitalize">
                    {diaCorto(d.fecha)}
                    {d.fecha === hoy ? <span className="ml-1 text-xs text-indigo-300">(hoy)</span> : null}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="text-gray-400">
                        {d.clientes} cliente{d.clientes === 1 ? '' : 's'}
                      </span>
                      <span className="text-white tabular-nums">{formatSaldo(d.cobro)}</span>
                    </div>
                    <Barra valor={d.cobro} max={maxDia} />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="text-gray-400">
                        {d.cuentas} cuenta{d.cuentas === 1 ? '' : 's'}
                      </span>
                      <span className="text-white tabular-nums">{formatSaldo(d.pago)}</span>
                    </div>
                    <Barra valor={d.pago} max={maxDia} color="bg-red-400" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      <Seccion
        titulo="Por plataforma"
        descripcion="Lo que vendes cada mes contra lo que te cuestan sus cuentas. El margen es cuánto te queda de cada $100 vendidos."
      >
        <div className="hidden lg:grid grid-cols-[minmax(10rem,1.4fr)_6rem_1fr_7rem_7rem_8rem] gap-4 px-2 pb-2 text-xs uppercase tracking-wide text-gray-500">
          <span>Plataforma</span>
          <span className="text-right">Perfiles</span>
          <span>Ventas</span>
          <span className="text-right">Costo</span>
          <span className="text-right">Ganancia</span>
          <span className="text-right">Margen</span>
        </div>
        <ul className="divide-y divide-gray-700/70">
          {plataformas.map((p) => {
            const margen = porcentaje(p.ganancia, p.venta)
            return (
              <li
                key={p.plataforma}
                className="grid grid-cols-2 lg:grid-cols-[minmax(10rem,1.4fr)_6rem_1fr_7rem_7rem_8rem] gap-x-4 gap-y-1.5 px-2 py-2.5 items-center text-sm"
              >
                <span className="text-white font-medium col-span-2 lg:col-span-1 break-words">{p.plataforma}</span>
                <span className="text-gray-400 lg:text-right tabular-nums">
                  {p.perfiles} perfiles · {p.cuentas} ctas
                </span>
                <div className="min-w-0 space-y-1 col-span-2 lg:col-span-1 order-last lg:order-none">
                  <div className="flex justify-between gap-2">
                    <span className="text-gray-500 lg:hidden">Ventas</span>
                    <span className="text-white tabular-nums">{formatSaldo(p.venta)}</span>
                  </div>
                  <Barra valor={p.venta} max={maxVenta} />
                </div>
                <span className="text-right text-gray-300 tabular-nums">
                  <span className="text-gray-500 lg:hidden">Costo </span>
                  {formatSaldo(p.costo)}
                </span>
                <span className={`lg:text-right tabular-nums ${p.ganancia >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  <span className="text-gray-500 lg:hidden">Ganancia </span>
                  {formatSaldo(p.ganancia)}
                </span>
                <span
                  className={`text-right tabular-nums font-medium ${
                    !p.venta ? 'text-gray-500' : margen < 40 ? 'text-amber-300' : 'text-green-300'
                  }`}
                >
                  <span className="text-gray-500 font-normal lg:hidden">Margen </span>
                  {p.venta ? `${margen}%` : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      </Seccion>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
        <Seccion
          titulo="Vencidos sin renovar"
          descripcion={
            vencidos.clientes
              ? `${vencidos.clientes} cliente${vencidos.clientes === 1 ? '' : 's'} · ${formatSaldo(vencidos.valor)} pendientes de cobrar o cortar.`
              : 'Ningún cliente está vencido.'
          }
        >
          {vencidos.lista.length ? (
            <ul className="divide-y divide-gray-700/70">
              {vencidos.lista.map((v) => (
                <li key={`${v.cliente}-${v.fecha}`} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-white">{v.cliente}</p>
                    <p className="text-xs text-gray-400">{v.plataformas.join(' · ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white tabular-nums">{formatSaldo(v.valor)}</p>
                    <p className="text-xs text-red-300 capitalize">{diaCorto(v.fecha)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Todo al día.</p>
          )}
        </Seccion>

        <Seccion
          titulo="Datos por completar"
          descripcion={
            hayIncompletos
              ? 'Estos registros no tienen precio, así que los totales de arriba quedan un poco cortos.'
              : 'Todos los clientes y cuentas tienen precio.'
          }
        >
          {hayIncompletos ? (
            <div className="space-y-4">
              {incompletos.clientes_sin_precio.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Clientes sin precio de venta ({incompletos.clientes_sin_precio.length})
                  </p>
                  <ul className="divide-y divide-gray-700/70">
                    {incompletos.clientes_sin_precio.map((c, i) => (
                      <li key={`${c.cliente}-${i}`} className="py-1.5 text-sm">
                        <span className="text-white">{c.cliente}</span>
                        <span className="text-gray-400"> · {[...new Set(c.plataformas)].join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {incompletos.cuentas_sin_costo.length ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                    Cuentas sin costo ({incompletos.cuentas_sin_costo.length})
                  </p>
                  <ul className="divide-y divide-gray-700/70">
                    {incompletos.cuentas_sin_costo.map((c) => (
                      <li key={c.correo} className="py-1.5 text-sm min-w-0">
                        <span className="text-white break-all">{c.correo}</span>
                        <span className="text-gray-400">
                          {' '}· {c.plataforma}
                          {c.proveedor ? ` · ${c.proveedor}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </Seccion>
      </div>
    </div>
  )
}
