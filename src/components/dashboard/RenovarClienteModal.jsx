import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'
import { fechaHoy, formatFecha, puestoCortado, sumarDias } from '../../lib/vencimientos'

function fechaKey(value) {
  const s = String(value || '').slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
}

export default function RenovarClienteModal({ isOpen, onClose, onSaved, cliente }) {
  const { request } = useApi()
  const [lineas, setLineas] = useState([])
  const [fechaGlobal, setFechaGlobal] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen || !cliente) return
    const filas = (cliente.usuario_cuenta || [])
      .filter((p) => p.cuenta && p.id && !puestoCortado(p))
      .map((puesto) => {
      const actual = fechaKey(puesto.vencimiento_usuario)
      return {
        id_puesto: puesto.id,
        id_cuenta: puesto.cuenta.id,
        plataforma: puesto.cuenta?.plataforma?.nombre_plat || '—',
        correo: puesto.cuenta?.correo || '—',
        fechaActual: actual,
        fechaNueva: actual ? sumarDias(actual, 30) : sumarDias(fechaHoy(), 30),
        incluida: true,
      }
    })
    setLineas(filas)
    setFechaGlobal(filas[0]?.fechaNueva || sumarDias(fechaHoy(), 30))
    setError('')
  }, [isOpen, cliente])

  function aplicarASeleccionadas(fecha) {
    setFechaGlobal(fecha)
    setLineas((prev) => prev.map((l) => (l.incluida ? { ...l, fechaNueva: fecha } : l)))
  }

  const seleccionadas = lineas.filter((l) => l.incluida)

  async function confirmar() {
    if (seleccionadas.length === 0) {
      setError('Elige al menos una cuenta para renovar.')
      return
    }
    const incompleta = seleccionadas.find((l) => !fechaKey(l.fechaNueva))
    if (incompleta) {
      setError('Todas las cuentas seleccionadas deben tener fecha.')
      return
    }
    setGuardando(true)
    setError('')
    const { error: err } = await request('/cuentas/vencimientos/fecha', {
      method: 'PATCH',
      body: JSON.stringify({
        fecha: fechaGlobal || seleccionadas[0].fechaNueva,
        tipo: 'combo',
        renovaciones: seleccionadas.map((l) => ({
          id_puesto: l.id_puesto,
          id_cuenta: l.id_cuenta,
          fecha: l.fechaNueva,
        })),
      }),
    })
    setGuardando(false)
    if (err) {
      setError(err)
      return
    }
    onSaved()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renovar cuentas"
      subtitle={cliente?.nombre || ''}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4">
        {lineas.length === 0 ? (
          <p className="text-sm text-gray-400">Este cliente no tiene cuentas activas para renovar.</p>
        ) : (
          <>
            <p className="text-sm text-gray-400">
              Confirma cuáles cuentas renovar y la fecha de cada una. Por defecto se suma +30 días a la fecha actual.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fecha para las seleccionadas</label>
              <input
                type="date"
                value={fechaGlobal}
                onChange={(e) => aplicarASeleccionadas(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => aplicarASeleccionadas(sumarDias(fechaGlobal || fechaHoy(), 30))}
              >
                +30 días
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => aplicarASeleccionadas(sumarDias(fechaHoy(), 30))}
              >
                Hoy +30
              </Button>
            </div>

            <div className="rounded-xl border border-gray-700 divide-y divide-gray-700 overflow-hidden">
              {lineas.map((linea) => (
                <label
                  key={linea.id_puesto}
                  className={`flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-3 cursor-pointer ${
                    linea.incluida ? 'bg-gray-900/40' : 'bg-gray-900/10 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={linea.incluida}
                      onChange={(e) =>
                        setLineas((prev) =>
                          prev.map((l) =>
                            l.id_puesto === linea.id_puesto ? { ...l, incluida: e.target.checked } : l
                          )
                        )
                      }
                      className="mt-1 rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium">{linea.plataforma}</p>
                      <p className="text-xs text-gray-400 truncate">{linea.correo}</p>
                      <p className="text-xs text-gray-500">Actual: {formatFecha(linea.fechaActual)}</p>
                    </div>
                  </div>
                  <div className="sm:w-40">
                    <input
                      type="date"
                      value={linea.fechaNueva}
                      disabled={!linea.incluida}
                      onChange={(e) =>
                        setLineas((prev) =>
                          prev.map((l) =>
                            l.id_puesto === linea.id_puesto ? { ...l, fechaNueva: e.target.value } : l
                          )
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                </label>
              ))}
            </div>

            <p className="text-xs text-gray-500">
              Se renovarán {seleccionadas.length} de {lineas.length} cuenta{lineas.length === 1 ? '' : 's'}.
            </p>
          </>
        )}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={confirmar}
            isLoading={guardando}
            disabled={lineas.length === 0}
            className="flex-1"
          >
            Confirmar renovación
          </Button>
        </div>
      </div>
    </Modal>
  )
}
