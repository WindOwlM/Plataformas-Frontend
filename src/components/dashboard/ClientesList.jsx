import { useState, useEffect, useMemo } from 'react'
import { ChevronDown, ChevronRight, Pencil, Plus, Users } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import ClienteModal from './ClienteModal'
import Button from '../ui/Button'
import { fieldClass } from '../ui/fieldStyles'
import FechaBadge from '../ui/FechaBadge'
import { CorteBadgePuesto } from '../ui/CorteBadges'
import { claseFila } from '../../lib/filaSeleccion'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const { request, loading } = useApi()

  useEffect(() => {
    cargarClientes()
  }, [])

  async function cargarClientes() {
    const { data } = await request('/clientes')
    if (data) setClientes(data)
  }

  async function crearCliente(clienteData) {
    const { data, error } = await request('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    })
    if (data && !error) {
      setClientes((prev) => [...prev, data.cliente || data])
    }
  }

  async function actualizarCliente(clienteData) {
    const { data, error } = await request(`/clientes/${clienteEditando.id}`, {
      method: 'PATCH',
      body: JSON.stringify(clienteData),
    })
    if (data && !error) {
      const actualizado = data.cliente || data
      setClientes((prev) =>
        prev.map((c) =>
          c.id === clienteEditando.id ? { ...c, ...actualizado } : c
        )
      )
      setClienteEditando(null)
    }
  }

  function handleEdit(cliente) {
    setClienteEditando(cliente)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setClienteEditando(null)
  }

  function handleSubmit(clienteData) {
    if (clienteEditando) {
      return actualizarCliente(clienteData)
    }
    return crearCliente(clienteData)
  }

  function toggleExpand(id) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter((c) => String(c.nombre || '').toLowerCase().includes(q))
  }, [clientes, busqueda])

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Clientes</h2>
            <p className="text-sm text-gray-400 mt-1">
              {filtrados.length} de {clientes.length} registrados
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </div>

        <div className="p-4 sm:p-5 border-b border-gray-700">
          <label htmlFor="filtro-cliente" className="block text-sm font-medium text-gray-300 mb-2">
            Buscar por nombre
          </label>
          <input
            id="filtro-cliente"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Escribe el nombre del cliente..."
            className={fieldClass}
          />
        </div>

        <div className="divide-y divide-gray-700">
          {loading && clientes.length === 0 ? (
            <div className="p-10 text-center text-gray-400">Cargando clientes...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">
                {busqueda.trim() ? `No hay clientes que coincidan con “${busqueda.trim()}”` : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            filtrados.map((cliente) => {
              const cuentas = (cliente.usuario_cuenta || []).filter((p) => p.cuenta)
              const expanded = expandedIds.has(cliente.id)
              return (
                <div key={cliente.id}>
                  <div className={claseFila(isModalOpen && clienteEditando?.id === cliente.id, 'px-4 py-3.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors gap-3')}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 shrink-0 bg-indigo-600/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-300">
                          {cliente.nombre?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium truncate">{cliente.nombre}</p>
                        <p className="text-sm text-gray-400">
                          {cliente.numero_telefono || 'Sin teléfono'}
                          <span className="text-gray-600"> · </span>
                          {cuentas.length} cuenta{cuentas.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="secondary" onClick={() => toggleExpand(cliente.id)}>
                        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {expanded ? 'Ocultar' : 'Desplegar'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleEdit(cliente)}
                        className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg"
                        title="Editar cliente"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div className="px-4 pb-4">
                      {cuentas.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">Este cliente no tiene cuentas asignadas</p>
                      ) : (
                        <div className="rounded-lg border border-gray-700 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase">
                              <tr>
                                <th className="px-3 py-2 font-medium text-left">Plataforma</th>
                                <th className="px-3 py-2 font-medium text-left">Correo</th>
                                <th className="px-3 py-2 font-medium text-left">PIN</th>
                                <th className="px-3 py-2 font-medium text-left">Vencimiento</th>
                                <th className="px-3 py-2 font-medium text-left">Venta</th>
                                <th className="px-3 py-2 font-medium text-left">Notas</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700 bg-gray-900/40">
                              {cuentas.map((puesto) => (
                                <tr key={puesto.id}>
                                  <td className="px-3 py-2 text-white">
                                    {puesto.cuenta?.plataforma?.nombre_plat || '—'}
                                    {puesto.es_combo ? (
                                      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                        Combo
                                      </span>
                                    ) : null}
                                  </td>
                                  <td className="px-3 py-2 text-gray-300">{puesto.cuenta?.correo || '—'}</td>
                                  <td className="px-3 py-2 font-mono text-gray-300">{puesto.pin || '—'}</td>
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center gap-2 flex-wrap">
                                      <FechaBadge fecha={puesto.vencimiento_usuario} />
                                      <CorteBadgePuesto puesto={puesto} />
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-gray-300">
                                    {puesto.valor_venta != null ? `$${puesto.valor_venta}` : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-gray-400 max-w-[220px]">
                                    {puesto.notas || '—'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      <ClienteModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        cliente={clienteEditando}
      />
    </div>
  )
}
