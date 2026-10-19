import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Loader2, MonitorPlay, Pencil, Plus, Scissors, Trash2, UserPlus } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { fieldClass } from '../components/ui/fieldStyles'
import PuestoModal from '../components/dashboard/PuestoModal'
import CuentaModal from '../components/dashboard/CuentaModal'
import AutocompleteField, {
  labelCliente,
  labelCorreo,
  optionCorreo,
  optionId,
} from '../components/ui/AutocompleteField'
import Button from '../components/ui/Button'
import QuitarClienteModal from '../components/dashboard/QuitarClienteModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import {
  cuentaLlena,
  etiquetaEstado,
  puestosDe,
} from '../lib/cuentaEstado'
import { esComboPuesto, seccionesPorPlataforma } from '../lib/agruparCuentas'
import FechaBadge from '../components/ui/FechaBadge'
import CorteBadges, { CorteBadgePuesto } from '../components/ui/CorteBadges'
import { claseFila } from '../lib/filaSeleccion'
import { puestoCortado } from '../lib/vencimientos'

function estadoBadge(estado) {
  const colors = {
    disponible: 'bg-green-500/20 text-green-400 border-green-500/30',
    llena: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    vendida: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return colors[estado] || colors.disponible
}

export default function CuentasPage() {
  const { request, loading } = useApi()
  const [plataformas, setPlataformas] = useState([])
  const [plataformaId, setPlataformaId] = useState('')
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [correoFiltro, setCorreoFiltro] = useState('')
  const [correoQuery, setCorreoQuery] = useState('')
  const [usuarioQuery, setUsuarioQuery] = useState('')
  const [correoApi, setCorreoApi] = useState('')
  const [usuarioApi, setUsuarioApi] = useState('')
  const [sugerenciasCuenta, setSugerenciasCuenta] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [puestoCuenta, setPuestoCuenta] = useState(null)
  const [puestoEditando, setPuestoEditando] = useState(null)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false)
  const [cuentaEditando, setCuentaEditando] = useState(null)
  const [quitar, setQuitar] = useState(null)
  const [cuentaAEliminar, setCuentaAEliminar] = useState(null)

  const cargarCuentas = useCallback(async () => {
    const correo = correoFiltro || correoApi
    const usuario = clienteId ? '' : usuarioApi
    if (!plataformaId && !clienteId && !correo && !usuario) {
      setCuentas([])
      return
    }

    const params = new URLSearchParams()
    if (plataformaId && plataformaId !== 'todas') params.append('plataforma', plataformaId)
    if (clienteId) params.append('id_usuario', clienteId)
    else if (usuario) params.append('usuario', usuario)
    if (correo) params.append('correo', correo)

    const query = params.toString() ? `?${params.toString()}` : ''
    const { data } = await request(`/cuentas${query}`)
    setCuentas(data || [])
  }, [plataformaId, clienteId, correoFiltro, correoApi, usuarioApi, request])

  useEffect(() => {
    request('/catalogos/plataformas', { silent: true }).then(({ data }) => {
      if (data) setPlataformas(data)
    })
    request('/clientes', { silent: true }).then(({ data }) => {
      if (data) setClientes(data)
    })
  }, [request])

  useEffect(() => {
    cargarCuentas()
  }, [cargarCuentas])

  const buscaCuentaTimer = useRef(null)
  const buscaClienteTimer = useRef(null)

  const onQueryCuenta = useCallback((texto) => {
    window.clearTimeout(buscaCuentaTimer.current)
    const q = texto.trim()
    setCorreoQuery(q)
    buscaCuentaTimer.current = window.setTimeout(() => {
      setCorreoApi(q)
      if (q.length < 2) {
        setSugerenciasCuenta([])
        return
      }
      const params = new URLSearchParams({ correo: q, limit: '8' })
      if (plataformaId && plataformaId !== 'todas') params.append('plataforma', plataformaId)
      if (clienteId) params.append('id_usuario', clienteId)
      request(`/cuentas?${params.toString()}`, { silent: true }).then(({ data }) => {
        setSugerenciasCuenta(data || [])
      })
    }, 200)
  }, [plataformaId, clienteId, request])

  const onQueryCliente = useCallback((texto) => {
    window.clearTimeout(buscaClienteTimer.current)
    const q = texto.trim()
    setUsuarioQuery(q)
    buscaClienteTimer.current = window.setTimeout(() => {
      setUsuarioApi(q)
    }, 200)
  }, [])

  const guardarPuesto = useCallback(async (puestoData) => {
    const cuentaId = puestoCuenta?.id || puestoData.id_cuenta
    if (!cuentaId) return false

    const result = puestoData.id
      ? await request(`/cuentas/${cuentaId}/puestos/${puestoData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(puestoData),
        })
      : await request(`/cuentas/${cuentaId}/puestos`, {
          method: 'POST',
          body: JSON.stringify(puestoData),
        })
    if (result.error) return false
    await cargarCuentas()
    return true
  }, [puestoCuenta, request, cargarCuentas])

  const quitarCliente = useCallback(async (accion) => {
    if (!quitar?.cuenta?.id || !quitar?.puesto?.id) return
    const url = `/cuentas/${quitar.cuenta.id}/puestos/${quitar.puesto.id}${accion === 'ubicar' ? '/ubicar' : ''}`
    const result = await request(url, { method: accion === 'ubicar' ? 'POST' : 'DELETE' })
    setQuitar(null)
    if (!result.error) await cargarCuentas()
  }, [quitar, request, cargarCuentas])

  const guardarCuenta = useCallback(async (cuentaData) => {
    const result = cuentaEditando?.id
      ? await request(`/cuentas/${cuentaEditando.id}`, {
          method: 'PATCH',
          body: JSON.stringify(cuentaData),
        })
      : await request('/cuentas/crear', {
          method: 'POST',
          body: JSON.stringify(cuentaData),
        })
    if (result.error) return
    setIsCuentaModalOpen(false)
    setCuentaEditando(null)
    await cargarCuentas()
  }, [cuentaEditando, request, cargarCuentas])

  const abrirNuevaCuenta = useCallback(() => {
    setCuentaEditando(null)
    setIsCuentaModalOpen(true)
  }, [])

  const abrirEditarCuenta = useCallback((cuenta) => {
    setCuentaEditando(cuenta)
    setIsCuentaModalOpen(true)
  }, [])

  const abrirAsignar = useCallback((cuenta) => {
    setPuestoEditando(null)
    setPuestoCuenta(cuenta)
  }, [])

  const abrirEditarPuesto = useCallback((cuenta, puesto) => {
    setPuestoCuenta(cuenta)
    setPuestoEditando(puesto)
  }, [])

  const onClienteCreado = useCallback((cliente) => {
    if (!cliente?.id) return
    setClientes((prev) => [cliente, ...prev.filter((c) => c.id !== cliente.id)])
  }, [])

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleQuitar = useCallback((cuenta, puesto) => {
    setQuitar({ cuenta, puesto })
  }, [])

  const marcarCortado = useCallback(async (cuenta, puesto) => {
    if (!cuenta?.id || !puesto?.id) return
    const estado = puestoCortado(puesto) ? 'activa' : 'cortado'
    const { error } = await request(`/cuentas/${cuenta.id}/puestos/${puesto.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    })
    if (!error) await cargarCuentas()
  }, [request, cargarCuentas])

  const eliminarCuenta = useCallback(async () => {
    if (!cuentaAEliminar?.id) return
    const { error } = await request(`/cuentas/${cuentaAEliminar.id}`, { method: 'DELETE' })
    setCuentaAEliminar(null)
    if (!error) await cargarCuentas()
  }, [cuentaAEliminar, request, cargarCuentas])

  const plataformaNombre = useMemo(() => {
    if (plataformaId === 'todas' || (!plataformaId && (clienteId || correoFiltro || correoApi || usuarioApi))) {
      return 'Todas las plataformas'
    }
    return plataformas.find((p) => p.id === plataformaId)?.nombre_plat || ''
  }, [plataformaId, plataformas, clienteId, correoFiltro, correoApi, usuarioApi])

  const clienteNombre = useMemo(
    () => clientes.find((c) => c.id === clienteId)?.nombre,
    [clientes, clienteId]
  )

  const opcionesCuenta = useMemo(() => {
    if (correoFiltro && !sugerenciasCuenta.some((c) => c.correo === correoFiltro)) {
      return [{ id: correoFiltro, correo: correoFiltro }, ...sugerenciasCuenta]
    }
    return sugerenciasCuenta
  }, [correoFiltro, sugerenciasCuenta])

  const cuentasVista = useMemo(() => {
    let list = cuentas
    const cq = (correoFiltro || correoQuery).trim().toLowerCase()
    if (cq && !correoFiltro) {
      list = list.filter((c) => String(c.correo || '').toLowerCase().includes(cq))
    }
    const uq = usuarioQuery.trim().toLowerCase()
    if (uq && !clienteId) {
      list = list.filter((c) =>
        puestosDe(c).some((p) => String(p.usuario?.nombre || '').toLowerCase().includes(uq))
      )
    }
    return list
  }, [cuentas, correoFiltro, correoQuery, usuarioQuery, clienteId])

  const tituloLista = clienteNombre
    ? `Cuentas de ${clienteNombre}`
    : correoFiltro || correoQuery
      ? correoFiltro || correoQuery
      : plataformaNombre
  const sinFiltro = !plataformaId && !clienteId && !correoFiltro && !correoQuery && !usuarioQuery

  const secciones = useMemo(() => seccionesPorPlataforma(cuentasVista), [cuentasVista])
  const colSpan = 8

  const filasPorSeccion = useMemo(
    () =>
      secciones.map((seccion) => ({
        ...seccion,
        filas: seccion.cuentas.map((cuenta) => ({
          cuenta,
          puestos: puestosDe(cuenta),
          expanded: !!(
            clienteId
            || usuarioQuery
            || expandedIds.has(cuenta.id)
            || puestoEditando?.id_cuenta === cuenta.id
          ),
        })),
      })),
    [secciones, clienteId, usuarioQuery, expandedIds, puestoEditando]
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Cuentas</h2>
          <p className="text-sm text-gray-400 mt-1">
            Filtra por plataforma, correo de la cuenta o cliente
          </p>
        </div>
        <Button onClick={abrirNuevaCuenta}>
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="plataforma" className="block text-sm font-medium text-gray-300 mb-2">
              Plataforma
            </label>
            <select
              id="plataforma"
              value={plataformaId}
              onChange={(e) => setPlataformaId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Selecciona una plataforma</option>
              <option value="todas">Todas las plataformas</option>
              {plataformas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre_plat}
                </option>
              ))}
            </select>
          </div>
          <AutocompleteField
            id="cuenta-filtro"
            label="Cuenta"
            placeholder="Buscar por correo de la cuenta..."
            value={correoFiltro}
            onChange={setCorreoFiltro}
            options={opcionesCuenta}
            getOptionLabel={labelCorreo}
            getOptionValue={optionCorreo}
            onQueryChange={onQueryCuenta}
            filterLocal={false}
          />
          <AutocompleteField
            id="cliente-filtro"
            label="Cliente"
            placeholder="Buscar cliente para ver sus cuentas..."
            value={clienteId}
            onChange={setClienteId}
            options={clientes}
            getOptionLabel={labelCliente}
            getOptionValue={optionId}
            onQueryChange={onQueryCliente}
          />
        </div>
      </div>

      {sinFiltro ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <MonitorPlay className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Selecciona una plataforma, un correo o un cliente para ver las cuentas</p>
        </div>
      ) : loading && cuentas.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : cuentasVista.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">
            {clienteNombre
              ? `${clienteNombre} no tiene cuentas asignadas`
              : correoFiltro || correoQuery
                ? `No hay cuentas para ${correoFiltro || correoQuery}`
                : usuarioQuery
                  ? `No hay cuentas para ${usuarioQuery}`
                  : `No hay cuentas para ${plataformaNombre}`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-gray-300 font-medium">{tituloLista}</p>
            <p className="text-xs text-gray-500">{cuentasVista.length} cuenta{cuentasVista.length === 1 ? '' : 's'}</p>
          </div>
          {filasPorSeccion.map((seccion) => (
            <div key={seccion.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-900/40">
                <p className="text-sm text-white font-semibold">{seccion.nombre}</p>
                <span className="text-xs text-gray-500">
                  {seccion.filas.length} cuenta{seccion.filas.length === 1 ? '' : 's'}
                </span>
              </div>
              <div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2.5 font-medium">Correo</th>
                      <th className="px-3 py-2.5 font-medium">Contraseña</th>
                      <th className="px-3 py-2.5 font-medium">Proveedor</th>
                      <th className="px-3 py-2.5 font-medium">Estado</th>
                      <th className="px-3 py-2.5 font-medium">Vence</th>
                      <th className="px-3 py-2.5 font-medium">Costo</th>
                      <th className="px-3 py-2.5 font-medium">Puestos</th>
                      <th className="px-3 py-2.5 font-medium"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {seccion.filas.map(({ cuenta, puestos, expanded }) => (
                      <FragmentRow
                        key={cuenta.id}
                        cuenta={cuenta}
                        puestos={puestos}
                        expanded={expanded}
                        cuentas={cuentas}
                        clienteId={clienteId}
                        colSpan={colSpan}
                        onToggle={toggleExpand}
                        onAsignar={abrirAsignar}
                        onEditarCuenta={abrirEditarCuenta}
                        onEditarPuesto={abrirEditarPuesto}
                        onQuitar={handleQuitar}
                        onEliminarCuenta={setCuentaAEliminar}
                        onCortar={marcarCortado}
                        seleccionada={
                          cuentaEditando?.id === cuenta.id
                          || puestoCuenta?.id === cuenta.id
                          || cuentaAEliminar?.id === cuenta.id
                        }
                        puestoSeleccionadoId={puestoEditando?.id || quitar?.puesto?.id}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <PuestoModal
        isOpen={!!puestoCuenta}
        onClose={() => {
          setPuestoCuenta(null)
          setPuestoEditando(null)
        }}
        onSubmit={guardarPuesto}
        cuenta={puestoCuenta}
        puesto={puestoEditando}
        clientesPrecargados={clientes}
        onClienteCreado={onClienteCreado}
      />

      <CuentaModal
        isOpen={isCuentaModalOpen}
        onClose={() => {
          setIsCuentaModalOpen(false)
          setCuentaEditando(null)
        }}
        onSubmit={guardarCuenta}
        cuenta={cuentaEditando}
        plataformasPrecargadas={plataformas}
        clientesPrecargados={clientes}
        onClienteCreado={onClienteCreado}
      />

      <QuitarClienteModal
        isOpen={!!quitar}
        onClose={() => setQuitar(null)}
        onEliminar={() => quitarCliente('eliminar')}
        onUbicar={() => quitarCliente('ubicar')}
        nombre={quitar?.puesto?.usuario?.nombre}
        correo={quitar?.cuenta?.correo}
      />

      <ConfirmModal
        isOpen={!!cuentaAEliminar}
        onClose={() => setCuentaAEliminar(null)}
        onConfirm={eliminarCuenta}
        title="Eliminar cuenta"
        message={`¿Eliminar ${cuentaAEliminar?.correo}? Se quitarán también los clientes asignados a esta cuenta.`}
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  )
}

const FragmentRow = memo(function FragmentRow({
  cuenta,
  puestos,
  expanded,
  cuentas,
  clienteId,
  colSpan,
  onToggle,
  onAsignar,
  onEditarCuenta,
  onEditarPuesto,
  onQuitar,
  onEliminarCuenta,
  onCortar,
  seleccionada,
  puestoSeleccionadoId,
}) {
  const llena = cuentaLlena(cuenta)
  const estado = etiquetaEstado(cuenta.estado)

  return (
    <Fragment>
      <tr className={claseFila(seleccionada, 'hover:bg-gray-700/40 transition-colors')}>
        <td className="px-3 py-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-white font-medium whitespace-nowrap">{cuenta.correo}</span>
            {cuenta.correo ? (
              <button
                type="button"
                className="p-1 text-gray-500 hover:text-white rounded"
                title="Copiar correo"
                onClick={() => navigator.clipboard.writeText(cuenta.correo)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            ) : null}
            <CorteBadges puestos={puestos} />
          </span>
        </td>
        <td className="px-3 py-2">
          {cuenta.contrasena ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono text-gray-200 whitespace-nowrap">{cuenta.contrasena}</span>
              <button
                type="button"
                className="p-1 text-gray-500 hover:text-white rounded"
                title="Copiar contraseña"
                onClick={() => navigator.clipboard.writeText(cuenta.contrasena)}
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </td>
        <td className="px-3 py-2 text-gray-300 whitespace-nowrap">
          {cuenta.proveedor?.nombre_prov || '—'}
        </td>
        <td className="px-3 py-2">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(estado)}`}>
            {estado}
          </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <FechaBadge fecha={cuenta.fecha_vencimiento} empty="Sin fecha" />
        </td>
        <td className="px-3 py-2 text-gray-300 whitespace-nowrap">
          {cuenta.precio_costo != null ? `$${cuenta.precio_costo}` : '—'}
        </td>
        <td className="px-3 py-2 text-gray-300 whitespace-nowrap">
          {cuenta.ocupados ?? puestos.length}/{cuenta.max_puestos ?? 5}
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="secondary" onClick={() => onEditarCuenta(cuenta)} title="Editar">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
            <Button size="sm" onClick={() => onAsignar(cuenta)} disabled={llena} title={llena ? 'Llena' : 'Asignar'}>
              <UserPlus className="h-3.5 w-3.5" />
              {llena ? 'Llena' : 'Asignar'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onToggle(cuenta.id)} title={expanded ? 'Ocultar' : 'Desplegar'}>
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => onEliminarCuenta(cuenta)}
              title="Eliminar cuenta"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-900/50">
          <td colSpan={colSpan} className="px-4 py-3">
            {puestos.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">Esta cuenta no tiene clientes asignados</p>
            ) : (
              <div className="rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="px-3 py-2 font-medium text-left">Cliente</th>
                      <th className="px-3 py-2 font-medium text-left">Teléfono</th>
                      <th className="px-3 py-2 font-medium text-left">PIN</th>
                      <th className="px-3 py-2 font-medium text-left">Vencimiento</th>
                      <th className="px-3 py-2 font-medium text-left">Venta</th>
                      <th className="px-3 py-2 font-medium text-right"> </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {puestos.map((puesto, index) => {
                      const esFiltro = clienteId && puesto.id_usuario === clienteId
                      const esPuestoSel = puestoSeleccionadoId && puesto.id === puestoSeleccionadoId
                      return (
                        <tr
                          key={puesto.id || index}
                          className={claseFila(esPuestoSel, esFiltro ? 'bg-indigo-500/10' : '')}
                        >
                          <td className="px-3 py-2 text-white">
                            <span className="inline-flex items-center gap-2 flex-wrap">
                              {puesto.usuario?.nombre || 'Sin cliente'}
                              {esComboPuesto(puesto, cuentas) && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  Combo
                                </span>
                              )}
                              <CorteBadgePuesto puesto={puesto} />
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-400">
                            {puesto.usuario?.numero_telefono || '—'}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-300">
                            {puesto.pin || '—'}
                          </td>
                          <td className="px-3 py-2">
                            <FechaBadge fecha={puesto.vencimiento_usuario} />
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {puesto.valor_venta != null ? `$${puesto.valor_venta}` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <div className="inline-flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onCortar(cuenta, puesto)}
                                className={`p-1.5 rounded-lg ${
                                  puestoCortado(puesto)
                                    ? 'text-slate-300 hover:text-white hover:bg-slate-400/10'
                                    : 'text-red-400 hover:text-red-300 hover:bg-red-400/10'
                                }`}
                                title={puestoCortado(puesto) ? 'Marcar como activo' : 'Marcar como cortado'}
                              >
                                <Scissors className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditarPuesto(cuenta, puesto)}
                                className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg"
                                title="Editar PIN, precio y vencimiento"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onQuitar(cuenta, puesto)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg"
                                title="Quitar de la cuenta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  )
})
