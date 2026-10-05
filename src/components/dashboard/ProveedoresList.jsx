import { useState, useEffect } from 'react'
import { Plus, Pencil, Truck } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import CatalogModal from './CatalogModal'
import Button from '../ui/Button'

export default function ProveedoresList() {
  const [proveedores, setProveedores] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [proveedorEditando, setProveedorEditando] = useState(null)
  const { request } = useApi()

  useEffect(() => {
    cargarProveedores()
  }, [])

  async function cargarProveedores() {
    const { data } = await request('/catalogos/proveedores')
    if (data) setProveedores(data)
  }

  async function crearProveedor(payload) {
    const { data, error } = await request('/catalogos/proveedores', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (data && !error) {
      setProveedores([...proveedores, data.proveedor || data])
    }
  }

  async function actualizarProveedor(payload) {
    const { data, error } = await request(`/catalogos/proveedores/${proveedorEditando.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (data && !error) {
      setProveedores(proveedores.map((p) =>
        p.id === proveedorEditando.id ? (data.proveedor || data) : p
      ))
      setProveedorEditando(null)
    }
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setProveedorEditando(null)
  }

  function handleSubmit(payload) {
    if (proveedorEditando) return actualizarProveedor(payload)
    return crearProveedor(payload)
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-700 flex justify-between items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Proveedores</h3>
          <p className="text-sm text-gray-400 mt-1">{proveedores.length} registrados</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </Button>
      </div>

      <div className="divide-y divide-gray-700">
        {proveedores.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="h-10 w-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay proveedores registrados</p>
            <p className="text-sm text-gray-500 mt-1">Agrega de quién compras las cuentas</p>
          </div>
        ) : (
          proveedores.map((p) => (
            <div
              key={p.id}
              className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors group"
            >
              <span className="text-white">{p.nombre_prov}</span>
              <button
                type="button"
                onClick={() => {
                  setProveedorEditando(p)
                  setIsModalOpen(true)
                }}
                className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Editar proveedor"
              >
                <Pencil className="h-5 w-5" />
              </button>
            </div>
          ))
        )}
      </div>

      <CatalogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        item={proveedorEditando}
        titleNew="Nuevo proveedor"
        titleEdit="Editar proveedor"
        label="Nombre"
        placeholder="Ej: Proveedor Juan, Cuentas Premium..."
        nameKey="nombre_prov"
      />
    </div>
  )
}
