import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import AddModal from './AddModal'

export default function ProveedoresList() {
  const [proveedores, setProveedores] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { request, loading } = useApi()

  useEffect(() => {
    cargarProveedores()
  }, [])

  async function cargarProveedores() {
    const { data } = await request('/catalogos/proveedores')
    if (data) setProveedores(data)
  }

  async function crearProveedor(nombre) {
    const { data } = await request('/catalogos/proveedores', {
      method: 'POST',
      body: JSON.stringify({ nombre_prov: nombre }),
    })
    if (data) {
      setProveedores([...proveedores, data])
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Proveedores</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar
        </button>
      </div>

      <div className="divide-y divide-gray-700">
        {proveedores.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">No hay proveedores registrados</p>
        ) : (
          proveedores.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
              <span className="text-white">{p.nombre_prov}</span>
              <span className="text-xs text-gray-500 font-mono">{p.id.slice(0, 8)}...</span>
            </div>
          ))
        )}
      </div>

      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={crearProveedor}
        title="Nuevo Proveedor"
        placeholder="Ej: Proveedor Juan, Cuentas Premium..."
      />
    </div>
  )
}