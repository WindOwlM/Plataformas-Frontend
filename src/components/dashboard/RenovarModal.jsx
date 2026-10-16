import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'
import { fechaHoy, formatFecha, sumarDias } from '../../lib/vencimientos'
import { cuentaLlena } from '../../lib/cuentaEstado'

let lineaSeq = 0
function nuevaKey() {
  lineaSeq += 1
  return `linea-${Date.now()}-${lineaSeq}`
}

function lineaDesdeAsignacion(asig, fechaDefault) {
  return {
    key: nuevaKey(),
    id_puesto: asig.id_puesto || null,
    id_cuenta: asig.id_cuenta || '',
    id_plataforma: asig.id_plataforma || '',
    plataformaNombre: asig.plataforma || '',
    pin: asig.pin || '',
    valor_venta: asig.valor ?? asig.valor_venta ?? '',
    vencimiento_usuario: fechaDefault,
    correo: asig.correo || '',
  }
}

function lineasIniciales(item, fechaDefault) {
  if (item?.tipo === 'combo' && item.asignaciones?.length) {
    return item.asignaciones.map((asig) =>
      lineaDesdeAsignacion(asig, sumarDias(asig.fecha || item.fecha, 30))
    )
  }
  if (item?.tipo === 'usuario') {
    return [
      lineaDesdeAsignacion(
        {
          id_puesto: item.id_puesto,
          id_cuenta: item.id_cuenta,
          id_plataforma: item.id_plataforma,
          plataforma: item.plataforma,
          pin: item.pin,
          valor: item.valor,
          correo: item.correo,
        },
        fechaDefault
      ),
    ]
  }
  return []
}

export default function RenovarModal({ isOpen, item, onClose, onSaved }) {
  const { request } = useApi()
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [editarPlataformas, setEditarPlataformas] = useState(false)
  const [lineas, setLineas] = useState([])
  const [plataformas, setPlataformas] = useState([])
  const [cuentasPorPlat, setCuentasPorPlat] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorLocal, setErrorLocal] = useState('')
  const cuentasCargadas = useRef(new Set())

  const esCuenta = item?.tipo === 'cuenta'
  const puedeEditarPlataformas = item?.tipo === 'usuario' || item?.tipo === 'combo'
  const puestosOrigen = useMemo(() => {
    if (!item) return []
    if (item.tipo === 'combo' && item.asignaciones?.length) {
      return item.asignaciones.map((asig) => asig.id_puesto).filter(Boolean)
    }
    return item.id_puesto ? [item.id_puesto] : []
  }, [item])

  useEffect(() => {
    if (!isOpen || !item) return
    const fecha = sumarDias(item.fecha, 30)
    setNuevaFecha(fecha)
    setEditarPlataformas(false)
    setLineas(lineasIniciales(item, fecha))
    setCuentasPorPlat({})
    cuentasCargadas.current = new Set()
    setErrorLocal('')
  }, [isOpen, item])

  useEffect(() => {
    if (!isOpen) return
    request('/catalogos/plataformas', { silent: true }).then(({ data }) => {
      if (data) setPlataformas(data)
    })
  }, [isOpen, request])

  useEffect(() => {
    if (!plataformas.length) return
    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id_plataforma) return linea
        const plat = plataformas.find((p) => p.nombre_plat === linea.plataformaNombre)
        return plat ? { ...linea, id_plataforma: plat.id } : linea
      })
    )
  }, [plataformas, item, editarPlataformas])

  const cargarCuentasPlat = useCallback(
    async (idPlataforma) => {
      if (!idPlataforma || cuentasCargadas.current.has(idPlataforma)) return
      cuentasCargadas.current.add(idPlataforma)
      const { data } = await request(`/cuentas?plataforma=${idPlataforma}`, { silent: true })
      setCuentasPorPlat((actual) => ({ ...actual, [idPlataforma]: data || [] }))
    },
    [request]
  )

  useEffect(() => {
    if (!isOpen || !editarPlataformas) return
    const ids = [...new Set(lineas.map((l) => l.id_plataforma).filter(Boolean))]
    ids.forEach((id) => {
      cargarCuentasPlat(id)
    })
  }, [isOpen, editarPlataformas, lineas, cargarCuentasPlat])

  function aplicarFecha(fecha) {
    setNuevaFecha(fecha)
    setLineas((prev) => prev.map((l) => ({ ...l, vencimiento_usuario: fecha })))
  }

  function actualizarLinea(key, patch) {
    setLineas((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  function cambiarPlataforma(key, idPlataforma) {
    actualizarLinea(key, {
      id_plataforma: idPlataforma,
      id_cuenta: '',
      correo: '',
    })
    cargarCuentasPlat(idPlataforma)
  }

  function agregarLinea() {
    setLineas((prev) => [
      ...prev,
      {
        key: nuevaKey(),
        id_puesto: null,
        id_cuenta: '',
        id_plataforma: '',
        pin: '',
        valor_venta: '',
        vencimiento_usuario: nuevaFecha,
        correo: '',
      },
    ])
  }

  function quitarLinea(key) {
    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))
  }

  async function guardar() {
    if (!item || !nuevaFecha) return
    setErrorLocal('')
    setGuardando(true)

    if (esCuenta || !editarPlataformas) {
      const { error } = await request('/cuentas/vencimientos/fecha', {
        method: 'PATCH',
        body: JSON.stringify({
          fecha: nuevaFecha,
          tipo: item.tipo,
          id_cuenta: item.id_cuenta || null,
          id_puesto: item.id_puesto || null,
          renovaciones: item.renovaciones || [],
        }),
      })
      setGuardando(false)
      if (error) {
        setErrorLocal(error)
        return
      }
      onSaved()
      return
    }

    const incompleta = lineas.find((l) => !l.id_plataforma || !l.id_cuenta || !l.vencimiento_usuario)
    if (incompleta) {
      setGuardando(false)
      setErrorLocal('Completa plataforma, cuenta y fecha en cada línea.')
      return
    }

    const { error } = await request('/cuentas/vencimientos/renovar', {
      method: 'POST',
      body: JSON.stringify({
        id_usuario: item.id_usuario,
        puestos_origen: puestosOrigen,
        lineas: lineas.map((l) => ({
          id_puesto: l.id_puesto || null,
          id_cuenta: l.id_cuenta,
          pin: l.pin,
          valor_venta: l.valor_venta,
          vencimiento_usuario: l.vencimiento_usuario,
        })),
      }),
    })
    setGuardando(false)
    if (error) {
      setErrorLocal(error)
      return
    }
    onSaved()
  }

  const subtitle = item?.tipo === 'combo'
    ? `${item.nombre} · ${(item.plataformas || []).join(' · ')}`
    : item?.nombre

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renovar"
      subtitle={subtitle}
      maxWidth={editarPlataformas ? 'max-w-3xl' : 'max-w-md'}
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Fecha actual: {formatFecha(item?.fecha)}
          {item?.tipo === 'combo' && !editarPlataformas
            ? '. Se aplica a las plataformas de este combo que vencen en este grupo.'
            : ''}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Nueva fecha</label>
          <input
            type="date"
            value={nuevaFecha}
            onChange={(e) => aplicarFecha(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => aplicarFecha(sumarDias(nuevaFecha || item?.fecha, 30))}
          >
            +30 días
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => aplicarFecha(sumarDias(fechaHoy(), 30))}
          >
            Hoy +30
          </Button>
        </div>

        {puedeEditarPlataformas && (
          <div className="pt-1">
            {!editarPlataformas ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditarPlataformas(true)}>
                Editar plataformas
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-gray-300">
                    Por defecto se mantienen las plataformas actuales. Puedes quitar, cambiar o agregar.
                  </p>
                  <Button type="button" size="sm" variant="secondary" onClick={() => setEditarPlataformas(false)}>
                    Solo fecha
                  </Button>
                </div>
                {lineas.map((linea, index) => {
                  const opciones = [...(cuentasPorPlat[linea.id_plataforma] || [])]
                  if (
                    linea.id_cuenta &&
                    !opciones.some((cuenta) => cuenta.id === linea.id_cuenta)
                  ) {
                    opciones.unshift({
                      id: linea.id_cuenta,
                      correo: linea.correo || 'Cuenta actual',
                      ocupados: 0,
                      max_puestos: 5,
                      estado: 'disponible',
                    })
                  }
                  const actualesIds = new Set(lineas.map((l) => l.id_cuenta).filter(Boolean))
                  return (
                    <div
                      key={linea.key}
                      className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Plataforma {index + 1}
                        </p>
                        {lineas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => quitarLinea(linea.key)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                            title="Quitar de esta cuenta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma</label>
                          <select
                            value={linea.id_plataforma}
                            onChange={(e) => cambiarPlataforma(linea.key, e.target.value)}
                            className={fieldClass}
                          >
                            <option value="">Selecciona</option>
                            {plataformas.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre_plat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Cuenta</label>
                          <select
                            value={linea.id_cuenta}
                            onChange={(e) => {
                              const cuenta = opciones.find((c) => c.id === e.target.value)
                              actualizarLinea(linea.key, {
                                id_cuenta: e.target.value,
                                correo: cuenta?.correo || '',
                              })
                            }}
                            className={fieldClass}
                            disabled={!linea.id_plataforma}
                          >
                            <option value="">
                              {linea.id_plataforma ? 'Cuenta con cupo' : 'Elige plataforma'}
                            </option>
                            {opciones.map((cuenta) => {
                              const esActual = cuenta.id === linea.id_cuenta
                              const llena = cuentaLlena(cuenta) && !esActual
                              const ocupadaOtra = actualesIds.has(cuenta.id) && !esActual
                              return (
                                <option
                                  key={cuenta.id}
                                  value={cuenta.id}
                                  disabled={llena || ocupadaOtra}
                                >
                                  {cuenta.correo} · {cuenta.ocupados ?? 0}/{cuenta.max_puestos ?? 5}
                                  {llena ? ' (llena)' : ''}
                                </option>
                              )
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">PIN</label>
                          <input
                            type="text"
                            value={linea.pin}
                            onChange={(e) => actualizarLinea(linea.key, { pin: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Precio</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={linea.valor_venta}
                            onChange={(e) => actualizarLinea(linea.key, { valor_venta: e.target.value })}
                            className={fieldClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">Vencimiento</label>
                          <input
                            type="date"
                            value={linea.vencimiento_usuario}
                            onChange={(e) =>
                              actualizarLinea(linea.key, { vencimiento_usuario: e.target.value })
                            }
                            className={fieldClass}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
                <Button type="button" size="sm" variant="secondary" onClick={agregarLinea}>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar plataforma
                </Button>
              </div>
            )}
          </div>
        )}

        {errorLocal ? <p className="text-sm text-red-400">{errorLocal}</p> : null}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} isLoading={guardando} className="flex-1">
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
