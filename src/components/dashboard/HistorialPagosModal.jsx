import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import ConfirmModal from '../ui/ConfirmModal'
import { fieldClass } from '../ui/fieldStyles'
import { FilaPendiente } from '../reportes/PagosPanel'
import { formatFecha, formatSaldo } from '../../lib/vencimientos'

function plataformasDe(p) {
  return [...new Set((p.detalle || []).map((d) => d.plataforma).filter(Boolean))].join(' · ')
}

function descripcion(p) {
  if (p.tipo === 'saldo') {
    return p.monto >= 0
      ? { etiqueta: 'Saldo a favor', clase: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/40', signo: '+' }
      : { etiqueta: 'Saldo usado', clase: 'bg-gray-600/40 text-gray-200 border-gray-500/50', signo: '−' }
  }
  if (p.estado === 'pendiente') {
    return { etiqueta: 'Fiado', clase: 'bg-amber-500/15 text-amber-200 border-amber-500/40', signo: '' }
  }
  return { etiqueta: 'Pagó', clase: 'bg-green-500/15 text-green-300 border-green-500/40', signo: '' }
}

export default function HistorialPagosModal({ isOpen, cliente, onClose, onCambio }) {
  const { request } = useApi()
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [nuevoSaldo, setNuevoSaldo] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorSaldo, setErrorSaldo] = useState('')
  const [borrar, setBorrar] = useState(null)

  const cargar = useCallback(async () => {
    if (!cliente?.id) return
    setCargando(true)
    const { data } = await request(`/pagos/cliente/${cliente.id}`, { silent: true })
    setDatos(data || { tabla: false, movimientos: [] })
    setCargando(false)
  }, [cliente?.id, request])

  useEffect(() => {
    if (!isOpen) return
    setDatos(null)
    setNuevoSaldo(null)
    setErrorSaldo('')
    cargar()
  }, [isOpen, cargar])

  async function cambio() {
    await cargar()
    onCambio?.()
  }

  async function guardarSaldo() {
    const monto = Number(nuevoSaldo?.monto)
    if (!Number.isFinite(monto) || monto <= 0) {
      setErrorSaldo('Escribe un monto mayor que 0.')
      return
    }
    setGuardando(true)
    setErrorSaldo('')
    const { error } = await request('/pagos/saldo', {
      method: 'POST',
      body: JSON.stringify({ id_usuario: cliente.id, monto, notas: nuevoSaldo.motivo?.trim() || null }),
    })
    setGuardando(false)
    if (error) {
      setErrorSaldo(error)
      return
    }
    setNuevoSaldo(null)
    await cambio()
  }

  async function marcarPagado(p, { medio, monto }) {
    const { error } = await request(`/pagos/${p.id}/pagado`, {
      method: 'PATCH',
      body: JSON.stringify({ medio: medio || null, monto }),
    })
    if (error) return false
    await cambio()
    return true
  }

  async function confirmarBorrar() {
    const p = borrar
    setBorrar(null)
    const { error } = await request(`/pagos/${p.id}`, { method: 'DELETE' })
    if (!error) await cambio()
  }

  const movimientos = datos?.movimientos || []
  const pendientes = movimientos.filter((p) => p.tipo === 'cobro' && p.estado === 'pendiente')
  const historial = movimientos.filter((p) => !(p.tipo === 'cobro' && p.estado === 'pendiente'))
  const resumen = datos?.resumen || { pagado: 0, debe: 0, saldo: 0 }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pagos del cliente" subtitle={cliente?.nombre} maxWidth="max-w-2xl">
      {!datos || cargando ? (
        <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando…
        </div>
      ) : !datos.tabla ? (
        <p className="text-sm text-amber-200">
          Los pagos todavía no se pueden guardar: falta crear la tabla en Supabase (archivo sql/pago.sql).
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
              <p className="text-sm text-gray-400">Ha pagado</p>
              <p className="text-xl font-bold tabular-nums text-green-300">{formatSaldo(resumen.pagado)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
              <p className="text-sm text-gray-400">Debe</p>
              <p className={`text-xl font-bold tabular-nums ${resumen.debe ? 'text-amber-200' : 'text-white'}`}>
                {formatSaldo(resumen.debe)}
              </p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-900/40 px-4 py-3">
              <p className="text-sm text-gray-400">Saldo a favor</p>
              <p className={`text-xl font-bold tabular-nums ${resumen.saldo ? 'text-emerald-200' : 'text-white'}`}>
                {formatSaldo(resumen.saldo)}
              </p>
            </div>
          </div>

          {nuevoSaldo ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-3 space-y-3">
              <p className="text-sm font-medium text-white">Agregar saldo a favor</p>
              <div className="grid grid-cols-1 sm:grid-cols-[10rem_1fr] gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Monto</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    inputMode="numeric"
                    value={nuevoSaldo.monto}
                    onChange={(e) => setNuevoSaldo((s) => ({ ...s, monto: e.target.value }))}
                    className={fieldClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Motivo</label>
                  <input
                    type="text"
                    value={nuevoSaldo.motivo}
                    onChange={(e) => setNuevoSaldo((s) => ({ ...s, motivo: e.target.value }))}
                    className={fieldClass}
                    placeholder="Ej: compensación por 5 días sin Netflix"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Se descuenta cuando lo uses en Renovar. No cuenta como plata recibida ni gastada.
              </p>
              {errorSaldo ? <p className="text-sm text-red-400">{errorSaldo}</p> : null}
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={guardarSaldo} isLoading={guardando}>
                  Guardar saldo
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setNuevoSaldo(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setNuevoSaldo({ monto: '', motivo: '' })}>
              <Plus className="h-3.5 w-3.5" />
              Agregar saldo a favor
            </Button>
          )}

          {pendientes.length ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Fiados pendientes</p>
              <ul className="divide-y divide-gray-700/70">
                {pendientes.map((p) => (
                  <FilaPendiente key={p.id} p={p} onPagado={marcarPagado} onEliminar={setBorrar} />
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Historial</p>
            {historial.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">
                Todavía no hay pagos guardados. Aparecen aquí cuando renuevas con el recuadro de pago.
              </p>
            ) : (
              <ul className="divide-y divide-gray-700/70">
                {historial.map((p) => {
                  const d = descripcion(p)
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm text-white">{formatFecha(p.fecha_pagado || p.fecha)}</span>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border ${d.clase}`}
                          >
                            {d.etiqueta}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 break-words">
                          {[
                            p.medio,
                            plataformasDe(p),
                            p.fecha_pagado && p.fecha_pagado !== p.fecha && p.tipo === 'cobro'
                              ? `fiado el ${formatFecha(p.fecha)}`
                              : null,
                            p.tipo === 'saldo' || p.notas?.startsWith('Abono') ? p.notas : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white tabular-nums">
                          {d.signo}
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
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!borrar}
        onClose={() => setBorrar(null)}
        onConfirm={confirmarBorrar}
        title="Borrar registro"
        message={borrar ? `Se borra el registro de ${formatSaldo(Math.abs(borrar.monto))}. Las fechas de vencimiento no cambian.` : ''}
        confirmText="Borrar"
      />
    </Modal>
  )
}
