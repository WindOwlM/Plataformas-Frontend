import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import ClienteModal from './ClienteModal'

export default function ClientesList() {
  const [clientes, setClientes] = useState([])
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
    } else {
      return crearCliente(clienteData)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-white">Clientes</h3>
          <p className="text-sm text-gray-400 mt-1">{clientes.length} registrados</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      <div className="divide-y divide-gray-700">
        {clientes.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="h-12 w-12 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-400">No hay clientes registrados</p>
            <p className="text-sm text-gray-500 mt-1">Haz clic en "Nuevo Cliente" para agregar uno</p>
          </div>
        ) : (
          clientes.map((cliente) => (
            <div 
              key={cliente.id} 
              className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-300">
                    {cliente.nombre?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{cliente.nombre}</p>
                  {cliente.numero_telefono && (
                    <p className="text-sm text-gray-400">{cliente.numero_telefono}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleEdit(cliente)}
                className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                title="Editar cliente"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
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