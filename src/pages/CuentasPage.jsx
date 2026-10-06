import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, MonitorPlay, Plus, UserPlus } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { fieldClass } from '../components/ui/fieldStyles'
import PuestoModal from '../components/dashboard/PuestoModal'
import CuentaModal from '../components/dashboard/CuentaModal'
import AutocompleteField from '../components/ui/AutocompleteField'
import Button from '../components/ui/Button'

function estadoBadge(estado) {
  const colors = {
    disponible: 'bg-green-500/20 text-green-400 border-green-500/30',
    vendida: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    vencida: 'bg-red-500/20 text-red-400 border-red-500/30',
    suspendida: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return colors[estado] || colors.disponible
}

export default function CuentasPage() {
  const { request, loading } = useApi()
  const [plataformas, setPlataformas] = useState([])
  const [plataformaId, setPlataformaId] = useState('')
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [cuentas, setCuentas] = useState([])
  const [puestoCuenta, setPuestoCuenta] = useState(null)
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [isCuentaModalOpen, setIsCuentaModalOpen] = useState(false)

  async function cargarCuentas() {
    if (!plataformaId && !clienteId) {
      setCuentas([])
      return
    }

    const params = new URLSearchParams()
    if (plataformaId && plataformaId !== 'todas') params.append('plataforma', plataformaId)
    if (clienteId) params.append('id_usuario', clienteId)

    const query = params.toString() ? `?${params.toString()}` : ''
    const { data } = await request(`/cuentas${query}`)
    const lista = data || []
    setCuentas(
      clienteId
        ? lista.filter((c) =>
            (c.usuario_cuenta || c.usuarios_cuenta || []).some((p) => p.id_usuario === clienteId)
          )
        : lista
    )
  }

  useEffect(() => {
    request('/catalogos/plataformas').then(({ data }) => {
      if (data) setPlataformas(data)
    })
    request('/clientes').then(({ data }) => {
      if (data) setClientes(data)
    })
  }, [request])

  useEffect(() => {
    cargarCuentas()
  }, [plataformaId, clienteId])

  async function guardarPuesto(puestoData) {
    const cuentaId = puestoCuenta?.id || puestoData.id_cuenta
    if (!cuentaId) return false

    const result = await request(`/cuentas/${cuentaId}/puestos`, {
      method: 'POST',
      body: JSON.stringify(puestoData),
    })
    if (result.error) return false
    await cargarCuentas()
    return true
  }

  async function guardarCuenta(cuentaData) {
    const result = await request('/cuentas/crear', {
      method: 'POST',
      body: JSON.stringify(cuentaData),
    })
    if (result.error) return
    setIsCuentaModalOpen(false)
    await cargarCuentas()
  }

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const plataformaNombre = useMemo(() => {
    if (plataformaId === 'todas' || (!plataformaId && clienteId)) return 'Todas las plataformas'
    return plataformas.find((p) => p.id === plataformaId)?.nombre_plat || ''
  }, [plataformaId, plataformas, clienteId])

  const showPlataforma = plataformaId === 'todas' || !plataformaId
  const clienteNombre = clientes.find((c) => c.id === clienteId)?.nombre
  const tituloLista = clienteNombre
    ? `Cuentas de ${clienteNombre}`
    : plataformaNombre
  const sinFiltro = !plataformaId && !clienteId

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Cuentas</h2>
          <p className="text-sm text-gray-400 mt-1">
            Elige una plataforma o un cliente para ver las cuentas
          </p>
        </div>
        <Button onClick={() => setIsCuentaModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
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
            id="cliente-filtro"
            label="Cliente"
            placeholder="Buscar cliente para ver sus cuentas..."
            value={clienteId}
            onChange={setClienteId}
            options={clientes}
            getOptionLabel={(opt) =>
              opt.numero_telefono ? `${opt.nombre} · ${opt.numero_telefono}` : opt.nombre
            }
            getOptionValue={(opt) => opt.id}
          />
        </div>
      </div>

      {sinFiltro ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <MonitorPlay className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Selecciona una plataforma o un cliente para ver las cuentas</p>
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
              : `No hay cuentas para ${plataformaNombre}`}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-300 font-medium">{tituloLista}</p>
            <p className="text-xs text-gray-500">{cuentas.length} cuenta{cuentas.length === 1 ? '' : 's'}</p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  {showPlataforma && (
                    <th className="px-4 py-3 font-medium">Plataforma</th>
                  )}
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Vence</th>
                  <th className="px-4 py-3 font-medium">Costo</th>
                  <th className="px-4 py-3 font-medium">Puestos</th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {cuentas.map((cuenta) => {
                  const puestos = cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []
                  const expanded = clienteId ? true : expandedIds.has(cuenta.id)
                  const colSpan = showPlataforma ? 8 : 7
                  return (
                    <FragmentRow
                      key={cuenta.id}
                      cuenta={cuenta}
                      puestos={puestos}
                      expanded={expanded}
                      showPlataforma={showPlataforma}
                      clienteId={clienteId}
                      colSpan={colSpan}
                      onToggle={() => toggleExpand(cuenta.id)}
                      onAsignar={() => setPuestoCuenta(cuenta)}
                    />
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PuestoModal
        isOpen={!!puestoCuenta}
        onClose={() => setPuestoCuenta(null)}
        onSubmit={guardarPuesto}
        cuenta={puestoCuenta}
      />

      <CuentaModal
        isOpen={isCuentaModalOpen}
        onClose={() => setIsCuentaModalOpen(false)}
        onSubmit={guardarCuenta}
      />
    </div>
  )
}

function FragmentRow({
  cuenta,
  puestos,
  expanded,
  showPlataforma,
  clienteId,
  colSpan,
  onToggle,
  onAsignar,
}) {
  return (
    <>
      <tr className="hover:bg-gray-700/40 transition-colors">
        <td className="px-4 py-3 text-white font-medium">{cuenta.correo}</td>
        {showPlataforma && (
          <td className="px-4 py-3 text-gray-300">
            {cuenta.plataforma?.nombre_plat || '—'}
          </td>
        )}
        <td className="px-4 py-3 text-gray-300">
          {cuenta.proveedor?.nombre_prov || '—'}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(cuenta.estado)}`}>
            {cuenta.estado || '—'}
          </span>
        </td>
        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
          {cuenta.fecha_vencimiento || 'Sin fecha'}
        </td>
        <td className="px-4 py-3 text-gray-300">
          {cuenta.precio_costo != null ? `$${cuenta.precio_costo}` : '—'}
        </td>
        <td className="px-4 py-3 text-gray-300">{puestos.length}</td>
        <td className="px-4 py-3">
          <div className="flex items-center justify-end gap-2">
            <Button size="sm" onClick={onAsignar}>
              <UserPlus className="h-3.5 w-3.5" />
              Asignar
            </Button>
            <Button size="sm" variant="secondary" onClick={onToggle}>
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              {expanded ? 'Ocultar' : 'Desplegar'}
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {puestos.map((puesto, index) => {
                      const esFiltro = clienteId && puesto.id_usuario === clienteId
                      return (
                      <tr key={puesto.id || index} className={esFiltro ? 'bg-indigo-500/10' : ''}>
                        <td className="px-3 py-2 text-white">
                          {puesto.usuario?.nombre || 'Sin cliente'}
                        </td>
                        <td className="px-3 py-2 text-gray-400">
                          {puesto.usuario?.numero_telefono || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-300">
                          {puesto.pin || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          {puesto.vencimiento_usuario || '—'}
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          {puesto.valor_venta != null ? `$${puesto.valor_venta}` : '—'}
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
    </>
  )
}
