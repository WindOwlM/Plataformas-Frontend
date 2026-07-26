import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import AddModal from './AddModal'

export default function PlataformasList() {
  const [plataformas, setPlataformas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { request, loading } = useApi()

  useEffect(() => {
    cargarPlataformas()
  }, [])

  async function cargarPlataformas() {
    const { data } = await request('/catalogos/plataformas')
    if (data) setPlataformas(data)
  }

  async function crearPlataforma(nombre) {
    const { data } = await request('/catalogos/plataformas', {
      method: 'POST',
      body: JSON.stringify({ nombre_plat: nombre }),
    })
    if (data) {
      setPlataformas([...plataformas, data])
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">Plataformas</h3>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
        >
          + Agregar
        </button>
      </div>

      <div className="divide-y divide-gray-700">
        {plataformas.length === 0 ? (
          <p className="p-6 text-gray-400 text-center">No hay plataformas registradas</p>
        ) : (
          plataformas.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors">
              <span className="text-white">{p.nombre_plat}</span>
              <span className="text-xs text-gray-500 font-mono">{p.id.slice(0, 8)}...</span>
            </div>
          ))
        )}
      </div>

      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={crearPlataforma}
        title="Nueva Plataforma"
        placeholder="Ej: Netflix, Disney+, HBO Max..."
      />
    </div>
  )
}