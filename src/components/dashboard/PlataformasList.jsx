import { useState, useEffect } from 'react'
import { Plus, Pencil, MonitorPlay } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import CatalogModal from './CatalogModal'
import Button from '../ui/Button'

export default function PlataformasList() {
  const [plataformas, setPlataformas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [plataformaEditando, setPlataformaEditando] = useState(null)
  const { request } = useApi()

  useEffect(() => {
    cargarPlataformas()
  }, [])

  async function cargarPlataformas() {
    const { data } = await request('/catalogos/plataformas')
    if (data) setPlataformas(data)
  }

  async function crearPlataforma(payload) {
    const { data, error } = await request('/catalogos/plataformas', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (data && !error) {
      setPlataformas([...plataformas, data.plataforma || data])
    }
  }

  async function actualizarPlataforma(payload) {
    const { data, error } = await request(`/catalogos/plataformas/${plataformaEditando.id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    if (data && !error) {
      setPlataformas(plataformas.map((p) =>
        p.id === plataformaEditando.id ? (data.plataforma || data) : p
      ))
      setPlataformaEditando(null)
    }
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setPlataformaEditando(null)
  }

  function handleSubmit(payload) {
    if (plataformaEditando) return actualizarPlataforma(payload)
    return crearPlataforma(payload)
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-5 border-b border-gray-700 flex justify-between items-center gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Plataformas</h3>
          <p className="text-sm text-gray-400 mt-1">{plataformas.length} registradas</p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nueva plataforma
        </Button>
      </div>

      <div className="divide-y divide-gray-700">
        {plataformas.length === 0 ? (
          <div className="p-8 text-center">
            <MonitorPlay className="h-10 w-10 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No hay plataformas registradas</p>
            <p className="text-sm text-gray-500 mt-1">Agrega Netflix, Disney+, HBO Max, etc.</p>
          </div>
        ) : (
          plataformas.map((p) => (
            <div
              key={p.id}
              className="px-4 py-3.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors group"
            >
              <span className="text-white">{p.nombre_plat}</span>
              <button
                type="button"
                onClick={() => {
                  setPlataformaEditando(p)
                  setIsModalOpen(true)
                }}
                className="p-2 text-gray-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Editar plataforma"
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
        item={plataformaEditando}
        titleNew="Nueva plataforma"
        titleEdit="Editar plataforma"
        label="Nombre"
        placeholder="Ej: Netflix, Disney+, HBO Max..."
        nameKey="nombre_plat"
      />
    </div>
  )
}
