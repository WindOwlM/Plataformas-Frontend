import { useState, useEffect } from 'react'
import { Plus, Pencil, Users } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import ClienteModal from './ClienteModal'
import Button from '../ui/Button'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clienteEditando, setClienteEditando] = useState(null)
  const { request } = useApi()

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
      setClientes([...clientes, data.cliente || data])
    }
  }

  async function actualizarCliente(clienteData) {
    const { data, error } = await request(`/clientes/${clienteEditando.id}`, {
      method: 'PATCH',
      body: JSON.stringify(clienteData),
    })
    if (data && !error) {
      setClientes(clientes.map(c =>
        c.id === clienteEditando.id ? (data.cliente || data) : c
      ))
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

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-gray-700 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Clientes</h2>
          <p className="text-sm text-gray-400 mt-1">{clientes.length} registrados</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="divide-y divide-gray-700">
        {clientes.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay clientes registrados</p>
            <p className="text-sm text-gray-500 mt-1">Agrega un cliente para asignarlo a puestos</p>
          </div>
        ) : (
          clientes.map((cliente) => (
            <div
              key={cliente.id}
              className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 bg-indigo-600/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-indigo-300">
                    {cliente.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{cliente.nombre}</p>
                  {cliente.numero_telefono && (
                    <p className="text-sm text-gray-400">{cliente.numero_telefono}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleEdit(cliente)}
                className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Editar cliente"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>
          ))
        )}
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
