import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, MonitorPlay, Plus } from 'lucide-react'
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
import CorreosModal from '../components/dashboard/CorreosModal'
import { correoConectado } from '../components/correos/VisorCorreos'
import { registrarError } from '../lib/errorLog'
import ConfirmModal from '../components/ui/ConfirmModal'
import { cuentaInhabilitada, puestosDe } from '../lib/cuentaEstado'
import { filtrarCuentasTabla, seccionesPorPlataforma } from '../lib/agruparCuentas'
import { rutaCuentaDestino } from '../lib/rutaCuenta'
import { useDeudas } from '../lib/deudas'
import CuentaFila from '../components/cuentas/CuentaFila'

const filtroMovilClass =
  'w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-2 text-sm font-medium text-gray-200'

function FiltrosBar({
  sort,
  setSort,
  filtroProveedor,
  setFiltroProveedor,
  proveedoresTabla,
  filtroEstado,
  setFiltroEstado,
  filtroCorte,
  setFiltroCorte,
  soloInhabilitadas,
}) {
  const sortValue = sort.campo ? `${sort.campo}:${sort.dir}` : ''
  const hayFiltro = !!(filtroProveedor || filtroEstado || filtroCorte)
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 flex flex-col lg:flex-row lg:items-center gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 shrink-0 lg:mr-2">Filtros</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
      <select
        aria-label="Ordenar"
        value={sortValue}
        onChange={(e) => {
          if (!e.target.value) {
            setSort({ campo: '', dir: 'asc' })
            return
          }
          const [campo, dir] = e.target.value.split(':')
          setSort({ campo, dir })
        }}
        className={filtroMovilClass}
      >
        <option value="">Orden: combos primero</option>
        <option value="correo:asc">Correo A-Z</option>
        <option value="correo:desc">Correo Z-A</option>
        <option value="vence:asc">Vence más próximo</option>
        <option value="vence:desc">Vence más lejano</option>
        <option value="estado:asc">Disponible primero</option>
        <option value="estado:desc">Llena primero</option>
        <option value="puestos:asc">Más puestos libres</option>
        <option value="costo:desc">Costo más alto</option>
        <option value="costo:asc">Costo más bajo</option>
      </select>
      <select
        aria-label="Filtrar proveedor"
        value={filtroProveedor}
        onChange={(e) => setFiltroProveedor(e.target.value)}
        className={filtroMovilClass}
      >
        <option value="">Proveedor: todos</option>
        {proveedoresTabla.map((nombre) => (
          <option key={nombre} value={nombre}>{nombre}</option>
        ))}
      </select>
      {!soloInhabilitadas && (
        <select
          aria-label="Filtrar estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className={filtroMovilClass}
        >
          <option value="">Estado: todos</option>
          <option value="disponible">Disponible</option>
          <option value="llena">Llena</option>
        </select>
      )}
      <select
        aria-label="Filtrar corte"
        value={filtroCorte}
        onChange={(e) => setFiltroCorte(e.target.value)}
        className={filtroMovilClass}
      >
        <option value="">Puestos: todos</option>
        <option value="por_cortar">Por cortar</option>
        <option value="cortado">Cortado</option>
      </select>
      </div>
      {hayFiltro ? (
        <button
          type="button"
          onClick={() => {
            setFiltroProveedor('')
            setFiltroEstado('')
            setFiltroCorte('')
          }}
          className="shrink-0 rounded-md px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  )
}

export default function CuentasPage({ soloInhabilitadas = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { request, loading } = useApi()
  const { deudas } = useDeudas(request)
  const [plataformas, setPlataformas] = useState([])
  // En la vista de inhabilitadas se muestran todas las plataformas por defecto
  const [plataformaId, setPlataformaId] = useState(soloInhabilitadas ? 'todas' : '')
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
  const [cuentaAInhabilitar, setCuentaAInhabilitar] = useState(null)
  const [puestoACortar, setPuestoACortar] = useState(null)
  const [correosVinculados, setCorreosVinculados] = useState(() => new Set())
  const [correoAbierto, setCorreoAbierto] = useState(null)
  const [sort, setSort] = useState({ campo: '', dir: 'asc' })
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroProveedor, setFiltroProveedor] = useState('')
  const [filtroCorte, setFiltroCorte] = useState('')

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

  const cargarCorreosVinculados = useCallback(async () => {
    const { data } = await request('/correos/vinculados', { silent: true })
    if (Array.isArray(data)) setCorreosVinculados(new Set(data.map((c) => String(c.correo).toLowerCase())))
  }, [request])

  useEffect(() => {
    cargarCorreosVinculados()
  }, [cargarCorreosVinculados])

  // Vuelta desde Google/Microsoft después de conectar un correo
  useEffect(() => {
    const conectado = searchParams.get('correo_conectado')
    const fallo = searchParams.get('correo_error')
    if (!conectado && !fallo) return
    const pedido = searchParams.get('correo_pedido')
    if (fallo) {
      registrarError({ mensaje: `No se pudo conectar el correo: ${fallo}`, origen: 'Conectar correo' })
    } else {
      if (pedido) {
        registrarError({
          mensaje: `Conectaste ${conectado}, pero la cuenta es ${pedido}. Vuelve a conectar entrando con ${pedido}.`,
          origen: 'Conectar correo',
        })
      }
      cargarCorreosVinculados().then(() => setCorreoAbierto(pedido || conectado))
    }
    const next = new URLSearchParams(searchParams)
    next.delete('correo_conectado')
    next.delete('correo_error')
    next.delete('correo_pedido')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams, cargarCorreosVinculados])

  useEffect(() => {
    const plat = searchParams.get('plataforma')
    const correo = searchParams.get('correo')
    const cliente = searchParams.get('cliente')
    const cuenta = searchParams.get('cuenta')
    if (plat) setPlataformaId(plat)
    else if (correo || cliente) setPlataformaId((prev) => prev || 'todas')
    if (correo) {
      setCorreoFiltro(correo)
      setCorreoQuery(correo)
      setCorreoApi(correo)
    }
    if (cliente) setClienteId(cliente)
    if (cuenta) {
      setPlataformaId((prev) => prev || plat || 'todas')
      setExpandedIds((prev) => {
        const next = new Set(prev)
        next.add(cuenta)
        return next
      })
    }
  }, [searchParams])

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

  const guardarPuesto = useCallback(async (puestoData, extras = []) => {
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

    // El puesto principal ya quedó guardado: si alguna plataforma extra falla,
    // se avisa cuáles faltan para no volver a crear el principal al reintentar.
    const idPuesto = result.data?.puesto?.id || puestoData.id
    const fallidas = []
    for (const [index, extra] of extras.entries()) {
      if (!extra.id_cuenta) continue
      const extraResult = await request(`/cuentas/${extra.id_cuenta}/puestos`, {
        method: 'POST',
        body: JSON.stringify(extra),
      })
      if (extraResult.error) fallidas.push(index)
    }

    await cargarCuentas()
    if (fallidas.length > 0) return { idPuesto, fallidas }
    return true
  }, [puestoCuenta, request, cargarCuentas])

  const quitarCliente = useCallback(async (accion) => {
    if (!quitar?.cuenta?.id || !quitar?.puesto?.id) return
    const url = `/cuentas/${quitar.cuenta.id}/puestos/${quitar.puesto.id}${accion === 'ubicar' ? '/ubicar' : ''}`
    const result = await request(url, { method: accion === 'ubicar' ? 'POST' : 'DELETE' })
    setQuitar(null)
    if (!result.error) await cargarCuentas()
  }, [quitar, request, cargarCuentas])

  const borrarDefinitivo = useCallback(async (cuenta, puesto) => {
    if (!cuenta?.id || !puesto?.id) return
    const { error } = await request(`/cuentas/${cuenta.id}/puestos/${puesto.id}`, { method: 'DELETE' })
    if (!error) await cargarCuentas()
  }, [request, cargarCuentas])

  const deshacerCortado = useCallback(async (cuenta, puesto) => {
    if (!cuenta?.id || !puesto?.id) return
    const { error } = await request(`/cuentas/${cuenta.id}/puestos/${puesto.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'activa' }),
    })
    if (!error) await cargarCuentas()
  }, [request, cargarCuentas])

  const reubicarCliente = useCallback(async (idCuentaDestino, destino) => {
    if (!quitar?.cuenta?.id || !quitar?.puesto?.id || !idCuentaDestino) return false
    const { error } = await request(
      `/cuentas/${quitar.cuenta.id}/puestos/${quitar.puesto.id}/reubicar`,
      {
        method: 'POST',
        body: JSON.stringify({ id_cuenta: idCuentaDestino, borrar_origen: false }),
      }
    )
    if (error) return false
    setQuitar(null)
    navigate(rutaCuentaDestino(destino || { id: idCuentaDestino }))
    return true
  }, [quitar, request, navigate])

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

  const handleReubicar = useCallback((cuenta, puesto) => {
    setQuitar({ cuenta, puesto, soloReubicar: true })
  }, [])

  const marcarCortado = useCallback(async () => {
    const cuenta = puestoACortar?.cuenta
    const puesto = puestoACortar?.puesto
    if (!cuenta?.id || !puesto?.id) return
    const { error } = await request(`/cuentas/${cuenta.id}/puestos/${puesto.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado: 'cortado' }),
    })
    setPuestoACortar(null)
    if (!error) await cargarCuentas()
  }, [puestoACortar, request, cargarCuentas])

  const cambiarInhabilitada = useCallback(async (cuenta, inhabilitada) => {
    if (!cuenta?.id) return
    const { error } = await request(`/cuentas/${cuenta.id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ inhabilitada }),
    })
    setCuentaAInhabilitar(null)
    if (!error) await cargarCuentas()
  }, [request, cargarCuentas])

  const habilitarCuenta = useCallback((cuenta) => cambiarInhabilitada(cuenta, false), [cambiarInhabilitada])

  const confirmarInhabilitar = useCallback(async () => {
    await cambiarInhabilitada(cuentaAInhabilitar, true)
  }, [cambiarInhabilitada, cuentaAInhabilitar])

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
    // Las inhabilitadas solo se ven en su propia vista; al habilitarlas vuelven a Cuentas
    let list = cuentas.filter((c) => cuentaInhabilitada(c) === soloInhabilitadas)
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
    return filtrarCuentasTabla(list, {
      estado: filtroEstado,
      proveedor: filtroProveedor,
      corte: filtroCorte,
    })
  }, [cuentas, soloInhabilitadas, correoFiltro, correoQuery, usuarioQuery, clienteId, filtroEstado, filtroProveedor, filtroCorte])

  const proveedoresTabla = useMemo(() => {
    const set = new Set()
    for (const c of cuentas) {
      const n = String(c.proveedor?.nombre_prov || '').trim()
      if (n) set.add(n)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'es'))
  }, [cuentas])

  const tituloLista = clienteNombre
    ? `Cuentas de ${clienteNombre}`
    : correoFiltro || correoQuery
      ? correoFiltro || correoQuery
      : plataformaNombre
  const sinFiltro = !plataformaId && !clienteId && !correoFiltro && !correoQuery && !usuarioQuery

  const secciones = useMemo(() => seccionesPorPlataforma(cuentasVista, sort), [cuentasVista, sort])
  const hayFiltroColumna = !!(filtroEstado || filtroProveedor || filtroCorte)

  const propsFiltrosBar = {
    sort,
    setSort,
    filtroProveedor,
    setFiltroProveedor,
    proveedoresTabla,
    filtroEstado,
    setFiltroEstado,
    filtroCorte,
    setFiltroCorte,
    soloInhabilitadas,
  }

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
          <h2 className="text-xl font-bold text-white">
            {soloInhabilitadas ? 'Cuentas inhabilitadas' : 'Cuentas'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {soloInhabilitadas
              ? 'Al habilitar una cuenta vuelve a aparecer en Cuentas con las demás'
              : 'Filtra por plataforma, correo de la cuenta o cliente'}
          </p>
        </div>
        {!soloInhabilitadas && (
          <Button onClick={abrirNuevaCuenta}>
            <Plus className="h-4 w-4" />
            Nueva cuenta
          </Button>
        )}
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
      ) : cuentas.length === 0 ? (
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
          <FiltrosBar {...propsFiltrosBar} />
          {filasPorSeccion.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-900/40">
                <p className="text-sm text-white font-semibold">{plataformaNombre}</p>
              </div>
              <p className="px-3 py-10 text-center text-gray-400">
                {hayFiltroColumna
                  ? 'Ninguna cuenta coincide con ese filtro. Cambia o limpia los filtros para volver a verlas.'
                  : soloInhabilitadas
                    ? 'No hay cuentas inhabilitadas'
                    : `No hay cuentas para ${plataformaNombre}`}
              </p>
            </div>
          ) : filasPorSeccion.map((seccion) => (
            <div key={seccion.id} className="bg-gray-800 rounded-xl border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between bg-gray-900/40 rounded-t-xl">
                <p className="text-sm text-white font-semibold">{seccion.nombre}</p>
                <span className="text-xs text-gray-500">
                  {seccion.filas.length} cuenta{seccion.filas.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="divide-y divide-gray-700">
                {seccion.filas.map(({ cuenta, puestos, expanded }) => (
                  <CuentaFila
                    key={cuenta.id}
                    cuenta={cuenta}
                    puestos={puestos}
                    expanded={expanded}
                    cuentas={cuentas}
                    clienteId={clienteId}
                    deudas={deudas}
                    soloInhabilitadas={soloInhabilitadas}
                    onToggle={toggleExpand}
                    onAsignar={abrirAsignar}
                    onEditarCuenta={abrirEditarCuenta}
                    onEditarPuesto={abrirEditarPuesto}
                    onQuitar={handleQuitar}
                    onEliminarCuenta={setCuentaAEliminar}
                    onCorreos={setCorreoAbierto}
                    correoVinculado={correoConectado(correosVinculados, cuenta.correo)}
                    onInhabilitar={setCuentaAInhabilitar}
                    onHabilitar={habilitarCuenta}
                    onCortar={setPuestoACortar}
                    onBorrarDefinitivo={borrarDefinitivo}
                    onDeshacerCortado={deshacerCortado}
                    onReubicar={handleReubicar}
                    seleccionada={
                      cuentaEditando?.id === cuenta.id
                      || puestoCuenta?.id === cuenta.id
                      || cuentaAEliminar?.id === cuenta.id
                      || searchParams.get('cuenta') === cuenta.id
                    }
                    puestoSeleccionadoId={puestoEditando?.id || quitar?.puesto?.id}
                  />
                ))}
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
        onReubicar={reubicarCliente}
        nombre={quitar?.puesto?.usuario?.nombre}
        correo={quitar?.cuenta?.correo}
        cuentaId={quitar?.cuenta?.id}
        plataformaId={quitar?.cuenta?.id_plataforma}
        soloReubicar={!!quitar?.soloReubicar}
      />

      <ConfirmModal
        isOpen={!!cuentaAEliminar}
        onClose={() => setCuentaAEliminar(null)}
        onConfirm={eliminarCuenta}
        title="Eliminar cuenta"
        message={`¿Eliminar ${cuentaAEliminar?.correo}? Solo se puede si la cuenta ya no tiene clientes ni recordatorios para borrar.`}
        confirmText="Eliminar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!cuentaAInhabilitar}
        onClose={() => setCuentaAInhabilitar(null)}
        onConfirm={confirmarInhabilitar}
        title="Inhabilitar cuenta"
        message={`¿Inhabilitar ${cuentaAInhabilitar?.correo}? Pasará a la sección Inhabilitadas y no se podrá asignar ni reubicar en ella hasta que la habilites de nuevo.`}
        confirmText="Inhabilitar"
        variant="danger"
      />

      <ConfirmModal
        isOpen={!!puestoACortar}
        onClose={() => setPuestoACortar(null)}
        onConfirm={marcarCortado}
        title="Marcar para quitar del perfil"
        message={`¿Dejar a ${puestoACortar?.puesto?.usuario?.nombre || 'este cliente'} como recordatorio en ${puestoACortar?.cuenta?.correo || 'esta cuenta'}? El puesto se libera y quedará pendiente de borrarlo del perfil.`}
        confirmText="Cortar"
        variant="danger"
      />

      <CorreosModal
        isOpen={!!correoAbierto}
        onClose={() => setCorreoAbierto(null)}
        correo={correoAbierto}
        vinculado={!!correoAbierto && correoConectado(correosVinculados, correoAbierto)}
        onCambio={cargarCorreosVinculados}
      />
    </div>
  )
}
