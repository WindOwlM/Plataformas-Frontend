import { useCallback, useEffect, useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import ConfirmModal from '../ui/ConfirmModal'
import { fieldClass } from '../ui/fieldStyles'
import { MEDIOS_PAGO } from '../../lib/pagos'
import { formatFecha, formatSaldo } from '../../lib/vencimientos'

function quien(p) {
  return p.tipo === 'gasto' ? p.proveedor || 'Proveedor' : p.cliente || 'Cliente'
}

function plataformasDe(p) {
  const nombres = [...new Set((p.detalle || []).map((d) => d.plataforma).filter(Boolean))]
  return nombres.join(' · ')
}

function EtiquetaTipo({ p }) {
  if (p.tipo === 'saldo') {
    return p.monto >= 0 ? (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border bg-emerald-500/15 text-emerald-200 border-emerald-500/40">
        Saldo a favor
      </span>
    ) : (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border bg-gray-600/40 text-gray-200 border-gray-500/50">
        Saldo usado
      </span>
    )
  }
  if (p.estado === 'pendiente') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border bg-amber-500/15 text-amber-200 border-amber-500/40">
        {p.tipo === 'cobro' ? 'Fiado' : 'Le debo'}
      </span>
    )
  }
  return p.tipo === 'cobro' ? (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border bg-green-500/15 text-green-300 border-green-500/40">
      Cobro
    </span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border bg-red-500/15 text-red-300 border-red-500/40">
      Proveedor
    </span>
  )
}

// Fila de un pendiente con su mini formulario "Ya pagó"
export function FilaPendiente({ p, onPagado, onEliminar }) {
  const [abierto, setAbierto] = useState(false)
  const [medio, setMedio] = useState('')
  const [monto, setMonto] = useState(String(p.monto))
  const [guardando, setGuardando] = useState(false)

  async function confirmar() {
    setGuardando(true)
    const ok = await onPagado(p, { medio, monto })
    setGuardando(false)
    if (ok) setAbierto(false)
  }

  return (
    <li className="py-2.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-white text-sm font-medium">{quien(p)}</p>
            <EtiquetaTipo p={p} />
          </div>
          <p className="text-xs text-gray-400">
            Desde {formatFecha(p.fecha)}
            {plataformasDe(p) ? ` · ${plataformasDe(p)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white tabular-nums">{formatSaldo(p.monto)}</span>
          {!abierto ? (
            <Button size="sm" variant="success" onClick={() => setAbierto(true)}>
              <Check className="h-3.5 w-3.5" />
              {p.tipo === 'cobro' ? 'Ya pagó' : 'Ya pagué'}
            </Button>
          ) : null}
          <button
            type="button"
            onClick={() => onEliminar(p)}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
            title="Borrar este registro"
            aria-label="Borrar este registro"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {abierto ? (
        <div className="flex flex-wrap items-end gap-2 rounded-lg bg-gray-900/50 border border-gray-700 p-2">
          <div className="w-32">
            <label className="block text-xs text-gray-400 mb-1">Monto</label>
            <input
              type="number"
              min="0"
              step="100"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1">Medio</label>
            <select value={medio} onChange={(e) => setMedio(e.target.value)} className={fieldClass}>
              <option value="">Sin especificar</option>
              {MEDIOS_PAGO.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" variant="success" onClick={confirmar} isLoading={guardando}>
            Confirmar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAbierto(false)}>
            Cancelar
          </Button>
        </div>
      ) : null}
    </li>
  )
}

export default function PagosPanel({ mes, nombreMes, real, onCambio, Seccion }) {
  const { request } = useApi()
  const [movimientos, setMovimientos] = useState([])
  const [pendientes, setPendientes] = useState([])
  const [borrar, setBorrar] = useState(null)

  const cargar = useCallback(async () => {
    const [mesRes, pendRes] = await Promise.all([
      request(`/pagos?mes=${mes}`, { silent: true }),
      request('/pagos/pendientes', { silent: true }),
    ])
    setMovimientos(mesRes.data?.movimientos || [])
    setPendientes(pendRes.data?.pendientes || [])
  }, [mes, request])

  useEffect(() => {
    if (real) cargar()
  }, [real, cargar])

  async function marcarPagado(p, { medio, monto }) {
    const { error } = await request(`/pagos/${p.id}/pagado`, {
      method: 'PATCH',
      body: JSON.stringify({ medio: medio || null, monto }),
    })
    if (error) return false
    await cargar()
    onCambio()
    return true
  }

  async function confirmarBorrar() {
    const p = borrar
    setBorrar(null)
    const { error } = await request(`/pagos/${p.id}`, { method: 'DELETE' })
    if (error) return
    await cargar()
    onCambio()
  }

  if (!real) {
    return (
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        Los pagos todavía no se pueden guardar: falta crear la tabla en Supabase. Abre el SQL Editor y ejecuta el
        archivo <span className="font-mono">sql/pago.sql</span> del backend (una sola vez). Mientras tanto, Renovar
        sigue funcionando como siempre.
      </div>
    )
  }

  const pendientesCobro = pendientes.filter((p) => p.tipo === 'cobro')
  const pendientesGasto = pendientes.filter((p) => p.tipo === 'gasto')

  return (
    <>
      <Seccion
        titulo={`Pagos registrados en ${nombreMes}`}
        descripcion="Lo que realmente entró y salió al renovar con pago. Empieza a contar desde que se activó el registro de pagos."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
            <p className="text-sm text-gray-400">Cobrado</p>
            <p className="text-2xl font-bold tabular-nums text-green-300">{formatSaldo(real.cobrado)}</p>
            <p className="text-xs text-gray-500">{real.cobros} pago{real.cobros === 1 ? '' : 's'} de clientes</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
            <p className="text-sm text-gray-400">Pagado a proveedores</p>
            <p className="text-2xl font-bold tabular-nums text-red-300">{formatSaldo(real.pagado)}</p>
            <p className="text-xs text-gray-500">{real.gastos} pago{real.gastos === 1 ? '' : 's'}</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
            <p className="text-sm text-gray-400">Ganancia real</p>
            <p className={`text-2xl font-bold tabular-nums ${real.ganancia >= 0 ? 'text-white' : 'text-red-300'}`}>
              {formatSaldo(real.ganancia)}
            </p>
            <p className="text-xs text-gray-500">Cobrado menos pagado</p>
          </div>
          <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
            <p className="text-sm text-gray-400">Te deben (fiado)</p>
            <p className="text-2xl font-bold tabular-nums text-amber-200">{formatSaldo(real.fiado)}</p>
            <p className="text-xs text-gray-500">
              {real.fiados} cliente{real.fiados === 1 ? '' : 's'}
              {real.deuda_proveedores ? ` · tú debes ${formatSaldo(real.deuda_proveedores)}` : ''}
            </p>
            {real.saldo_favor ? (
              <p className="text-xs text-emerald-200/80">
                Saldo a favor de {real.clientes_saldo} cliente{real.clientes_saldo === 1 ? '' : 's'}: {formatSaldo(real.saldo_favor)}
              </p>
            ) : null}
          </div>
        </div>

        {real.por_medio.length ? (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Cobrado por medio de pago</p>
            <ul className="space-y-1.5">
              {real.por_medio.map((m) => (
                <li key={m.medio} className="grid grid-cols-[7rem_1fr_6rem] items-center gap-3 text-sm">
                  <span className="text-gray-300">{m.medio}</span>
                  <div className="h-2 rounded-full bg-gray-700/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.max(2, Math.round((m.valor / (real.cobrado || 1)) * 100))}%` }}
                    />
                  </div>
                  <span className="text-right text-white tabular-nums">{formatSaldo(m.valor)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Seccion>

      {pendientes.length ? (
        <Seccion
          titulo="Pendientes de pago"
          descripcion="Fiados de clientes y lo que les debes a proveedores, de cualquier mes. Márcalos cuando se paguen."
        >
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8">
            {pendientesCobro.length ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Te deben ({pendientesCobro.length})</p>
                <ul className="divide-y divide-gray-700/70">
                  {pendientesCobro.map((p) => (
                    <FilaPendiente key={p.id} p={p} onPagado={marcarPagado} onEliminar={setBorrar} />
                  ))}
                </ul>
              </div>
            ) : null}
            {pendientesGasto.length ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Debes a proveedores ({pendientesGasto.length})</p>
                <ul className="divide-y divide-gray-700/70">
                  {pendientesGasto.map((p) => (
                    <FilaPendiente key={p.id} p={p} onPagado={marcarPagado} onEliminar={setBorrar} />
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </Seccion>
      ) : null}

      <Seccion
        titulo={`Movimientos de ${nombreMes}`}
        descripcion="Cada pago guardado al renovar. Si alguno quedó mal, bórralo aquí: la fecha de vencimiento no cambia."
      >
        {movimientos.length === 0 ? (
          <p className="text-sm text-gray-400">
            Todavía no hay pagos registrados en este mes. Aparecen aquí cuando renuevas con "Pagó", "Fiado" o "Ya pagué".
          </p>
        ) : (
          <ul className="divide-y divide-gray-700/70">
            {movimientos.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-white text-sm font-medium">{quien(p)}</p>
                    <EtiquetaTipo p={p} />
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatFecha(p.fecha_pagado || p.fecha)}
                    {p.medio ? ` · ${p.medio}` : ''}
                    {plataformasDe(p) ? ` · ${plataformasDe(p)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`tabular-nums ${
                      p.tipo === 'saldo'
                        ? 'text-emerald-200'
                        : p.estado === 'pendiente'
                          ? 'text-amber-200'
                          : p.tipo === 'cobro'
                            ? 'text-green-300'
                            : 'text-red-300'
                    }`}
                  >
                    {(p.tipo === 'gasto' && p.estado === 'pagado') || (p.tipo === 'saldo' && p.monto < 0) ? '−' : ''}
                    {p.tipo === 'saldo' && p.monto >= 0 ? '+' : ''}
                    {formatSaldo(Math.abs(p.monto))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBorrar(p)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                    title="Borrar este registro"
                    aria-label="Borrar este registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <ConfirmModal
        isOpen={!!borrar}
        onClose={() => setBorrar(null)}
        onConfirm={confirmarBorrar}
        title="Borrar registro de pago"
        message={
          borrar
            ? `Se borra el registro de ${formatSaldo(borrar.monto)} de ${quien(borrar)}. La fecha de vencimiento no cambia.`
            : ''
        }
        confirmText="Borrar"
      />
    </>
  )
}
