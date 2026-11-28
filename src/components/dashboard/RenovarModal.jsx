import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'
import { fechaHoy, formatFecha, sumarDias } from '../../lib/vencimientos'
import { cuentaNoAsignable, etiquetaOpcionCuenta, ordenarCuentasPorCupo } from '../../lib/cuentaEstado'
import { errorPago, pagoInicial, pagoParaEnviar } from '../../lib/pagos'
import PagoRenovacion from './PagoRenovacion'

let lineaSeq = 0
function nuevaKey() {
  lineaSeq += 1
  return `linea-${Date.now()}-${lineaSeq}`
}

function lineaDesdeAsignacion(asig) {
  const actual = asig.fecha || ''
  return {
    key: nuevaKey(),
    id_puesto: asig.id_puesto || null,
    id_cuenta: asig.id_cuenta || '',
    id_plataforma: asig.id_plataforma || '',
    id_por_ubicar: asig.id_por_ubicar || null,
    plataformaNombre: asig.plataforma || '',
    pin: asig.pin || '',
    valor_venta: asig.valor ?? asig.valor_venta ?? '',
    fechaActual: actual,
    vencimiento_usuario: actual ? sumarDias(actual, 30) : sumarDias(fechaHoy(), 30),
    correo: asig.correo || '',
  }
}

function lineasIniciales(item) {
  if (item?.tipo === 'combo' && item.asignaciones?.length) {
    return item.asignaciones.map((asig) => lineaDesdeAsignacion(asig))
  }
  if (item?.tipo === 'usuario') {
    return [
      lineaDesdeAsignacion({
        id_puesto: item.id_puesto,
        id_cuenta: item.id_cuenta,
        id_plataforma: item.id_plataforma,
        plataforma: item.plataforma,
        pin: item.pin,
        valor: item.valor,
        correo: item.correo,
        fecha: item.fecha,
      }),
    ]
  }
  if (item?.tipo === 'por_ubicar') {
    return [
      lineaDesdeAsignacion({
        id_por_ubicar: item.id_por_ubicar,
        id_plataforma: item.id_plataforma,
        plataforma: item.plataforma,
        pin: item.pin,
        valor: item.valor,
        correo: item.correo,
        fecha: item.fecha,
      }),
    ]
  }
  if (item?.tipo === 'grupo_cuentas') {
    return (item.cuentas || []).map((c) => ({
      ...lineaDesdeAsignacion({
        id_cuenta: c.id_cuenta,
        plataforma: c.plataforma,
        correo: c.correo,
        fecha: c.fecha,
        valor: c.valor,
      }),
      incluir: true,
    }))
  }
  if (item?.tipo === 'cuenta') {
    return [
      lineaDesdeAsignacion({
        id_cuenta: item.id_cuenta,
        id_plataforma: item.id_plataforma,
        plataforma: item.plataforma,
        correo: item.correo,
        fecha: item.fecha,
        valor: item.valor,
      }),
    ]
  }
  return []
}

function FechaConAtajos({ value, onChange, actual }) {
  return (
    <div>
      {actual ? (
        <p className="text-xs text-gray-500 mb-1">Actual: {formatFecha(actual)}</p>
      ) : null}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
      <div className="flex flex-wrap gap-2 mt-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(sumarDias(value || actual, 30))}
        >
          +30 días
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => onChange(sumarDias(fechaHoy(), 30))}
        >
          Hoy +30
        </Button>
      </div>
    </div>
  )
}

export default function RenovarModal({ isOpen, item, onClose, onSaved }) {
  const { request } = useApi()
  const [editarPlataformas, setEditarPlataformas] = useState(false)
  const [lineas, setLineas] = useState([])
  const [plataformas, setPlataformas] = useState([])
  const [cuentasPorPlat, setCuentasPorPlat] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorLocal, setErrorLocal] = useState('')
  const [pago, setPago] = useState(pagoInicial)
  const cuentasCargadas = useRef(new Set())

  const esGrupo = item?.tipo === 'grupo_cuentas'
  const esCuenta = item?.tipo === 'cuenta' || esGrupo
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
    setEditarPlataformas(false)
    setLineas(lineasIniciales(item))
    setCuentasPorPlat({})
    cuentasCargadas.current = new Set()
    setErrorLocal('')
    setPago(pagoInicial())
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
        vencimiento_usuario: sumarDias(fechaHoy(), 30),
        correo: '',
      },
    ])
  }

  function quitarLinea(key) {
    setLineas((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)))
  }

  const lineasPago = esGrupo ? lineas.filter((l) => l.incluir) : lineas
  const montoSugerido = lineasPago.reduce((suma, l) => suma + (Number(l.valor_venta) || 0), 0)

  function datosPago() {
    const detalle = lineasPago.map((l) => ({
      plataforma:
        l.plataformaNombre ||
        plataformas.find((p) => p.id === l.id_plataforma)?.nombre_plat ||
        item?.plataforma ||
        '',
      correo: l.correo || (l.id_por_ubicar ? 'Por ubicar' : ''),
      valor: Number(l.valor_venta) || 0,
      fecha: l.vencimiento_usuario,
    }))
    return {
      pago: pagoParaEnviar(pago, detalle, montoSugerido),
      id_usuario: item?.id_usuario || null,
      proveedor: esGrupo ? item?.nombre : item?.proveedor || null,
    }
  }

  async function guardar() {
    if (!item) return
    const problemaPago = errorPago(pago, montoSugerido)
    if (problemaPago) {
      setErrorLocal(problemaPago)
      return
    }
    if (esGrupo) {
      const elegidas = lineas.filter((l) => l.incluir)
      if (elegidas.length === 0) {
        setErrorLocal('Marca al menos una cuenta para renovar.')
        return
      }
      if (elegidas.some((l) => !l.vencimiento_usuario)) {
        setErrorLocal('Cada cuenta marcada debe tener una fecha.')
        return
      }
      setErrorLocal('')
      setGuardando(true)
      const { error } = await request('/cuentas/vencimientos/fecha', {
        method: 'PATCH',
        body: JSON.stringify({
          tipo: 'cuentas',
          fecha: elegidas[0].vencimiento_usuario,
          renovaciones: elegidas.map((l) => ({ id_cuenta: l.id_cuenta, fecha: l.vencimiento_usuario })),
          ...datosPago(),
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

    const incompletaFecha = lineas.find((l) => !l.vencimiento_usuario)
    if (incompletaFecha) {
      setErrorLocal('Cada cuenta debe tener una fecha.')
      return
    }
    setErrorLocal('')
    setGuardando(true)

    if (esCuenta || item.tipo === 'por_ubicar' || !editarPlataformas) {
      const fechaPrincipal = lineas[0]?.vencimiento_usuario
      const tipoGuardar = item.tipo === 'combo' || lineas.length > 1 ? 'combo' : item.tipo
      const { error } = await request('/cuentas/vencimientos/fecha', {
        method: 'PATCH',
        body: JSON.stringify({
          fecha: fechaPrincipal,
          tipo: tipoGuardar,
          id_cuenta: item.id_cuenta || lineas[0]?.id_cuenta || null,
          id_puesto: item.id_puesto || lineas[0]?.id_puesto || null,
          id_por_ubicar: item.id_por_ubicar || lineas[0]?.id_por_ubicar || null,
          renovaciones: lineas.map((l) => ({
            id_puesto: l.id_puesto,
            id_cuenta: l.id_cuenta,
            id_por_ubicar: l.id_por_ubicar || null,
            fecha: l.vencimiento_usuario,
          })),
          ...datosPago(),
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

    const incompleta = lineas.find(
      (l) => !l.id_plataforma || (!l.id_cuenta && !l.id_por_ubicar) || !l.vencimiento_usuario
    )
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
          id_por_ubicar: l.id_por_ubicar || null,
          pin: l.pin,
          valor_venta: l.valor_venta,
          vencimiento_usuario: l.vencimiento_usuario,
        })),
        pago: datosPago().pago,
      }),
    })
    setGuardando(false)
    if (error) {
      setErrorLocal(error)
      return
    }
    onSaved()
  }

  const subtitle = esGrupo
    ? `${item.nombre} · ${item.cuentas?.length || 0} cuentas`
    : item?.tipo === 'combo'
    ? `${item.nombre} · ${(item.plataformas || []).join(' · ')}`
    : item?.tipo === 'por_ubicar'
      ? `${item.nombre} · Por ubicar`
      : item?.nombre

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Renovar"
      subtitle={subtitle}
      maxWidth={editarPlataformas ? 'max-w-3xl' : 'max-w-lg'}
    >
      <div className="space-y-4">
        {!editarPlataformas ? (
          <div className="space-y-3">
            {lineas.map((linea) => (
              <div
                key={linea.key}
                className={`rounded-xl border border-gray-700 bg-gray-900/40 p-3 space-y-2 ${esGrupo && !linea.incluir ? 'opacity-50' : ''}`}
              >
                {esGrupo ? (
                  <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!linea.incluir}
                      onChange={(e) => actualizarLinea(linea.key, { incluir: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-900"
                    />
                    Renovar esta cuenta
                  </label>
                ) : null}
                <div>
                  <p className="text-sm text-white font-medium">
                    {linea.plataformaNombre || item?.plataforma || 'Cuenta'}
                    {linea.id_por_ubicar ? (
                      <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                        Por ubicar
                      </span>
                    ) : null}
                  </p>
                  {linea.correo ? (
                    <p className="text-xs text-gray-400 truncate">
                      {linea.id_por_ubicar ? `Última cuenta: ${linea.correo}` : linea.correo}
                    </p>
                  ) : null}
                </div>
                {esGrupo && !linea.incluir ? null : (
                  <>
                <label className="block text-sm font-medium text-gray-300">Nueva fecha</label>
                <FechaConAtajos
                  value={linea.vencimiento_usuario}
                  actual={linea.fechaActual}
                  onChange={(fecha) => actualizarLinea(linea.key, { vencimiento_usuario: fecha })}
                />
                  </>
                )}
              </div>
            ))}
            {puedeEditarPlataformas ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditarPlataformas(true)}>
                Editar plataformas
              </Button>
            ) : null}
          </div>
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
                  const opciones = ordenarCuentasPorCupo(
                    [...(cuentasPorPlat[linea.id_plataforma] || [])],
                    linea.id_cuenta
                  )
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
                              {linea.id_por_ubicar
                                ? 'Sigue por ubicar'
                                : linea.id_plataforma ? 'Cuenta con cupo' : 'Elige plataforma'}
                            </option>
                            {opciones.map((cuenta) => {
                              const esActual = cuenta.id === linea.id_cuenta
                              const llena = cuentaNoAsignable(cuenta) && !esActual
                              return (
                                <option
                                  key={cuenta.id}
                                  value={cuenta.id}
                                  disabled={llena}
                                >
                                  {etiquetaOpcionCuenta(cuenta)}
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
                          <FechaConAtajos
                            value={linea.vencimiento_usuario}
                            actual={linea.fechaActual}
                            onChange={(fecha) => actualizarLinea(linea.key, { vencimiento_usuario: fecha })}
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

        <PagoRenovacion
          tipo={esCuenta ? 'gasto' : 'cobro'}
          pago={pago}
          onChange={setPago}
          sugerido={montoSugerido}
        />

        {errorLocal ? <p className="text-sm text-red-400">{errorLocal}</p> : null}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
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
