import { useEffect, useState } from 'react'
import { Loader2, MapPin, Trash2 } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import Button from '../components/ui/Button'
import ReubicarModal from '../components/dashboard/ReubicarModal'
import ConfirmModal from '../components/ui/ConfirmModal'

export default function PorUbicarPage() {
  const { request, loading } = useApi()
  const [filas, setFilas] = useState([])
  const [reubicar, setReubicar] = useState(null)
  const [eliminarId, setEliminarId] = useState(null)

  async function cargar() {
    const { data } = await request('/por-ubicar')
    setFilas(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    cargar()
  }, [])

  async function guardarReubicacion(payload) {
    const result = await request(`/por-ubicar/${reubicar.id}/reubicar`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (result.error) return false
    await cargar()
    return true
  }

  async function confirmarEliminar() {
    await request(`/por-ubicar/${eliminarId}`, { method: 'DELETE' })
    setEliminarId(null)
    await cargar()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Por ubicar</h2>
        <p className="text-sm text-gray-400 mt-1">
          Clientes sacados de una cuenta, listos para reubicar
        </p>
      </div>

      {loading && filas.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : filas.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <MapPin className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No hay clientes por ubicar</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Última plataforma</th>
                  <th className="px-4 py-3 font-medium">Última cuenta</th>
                  <th className="px-4 py-3 font-medium">PIN</th>
                  <th className="px-4 py-3 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filas.map((fila) => (
                  <tr key={fila.id} className="hover:bg-gray-700/40">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{fila.usuario?.nombre || '—'}</p>
                      <p className="text-xs text-gray-500">{fila.usuario?.numero_telefono || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{fila.plataforma?.nombre_plat || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{fila.cuenta?.correo || '—'}</td>
                    <td className="px-4 py-3 font-mono text-gray-300">{fila.pin || '—'}</td>
                    <td className="px-4 py-3 text-gray-300">{fila.vencimiento_usuario || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={() => setReubicar(fila)}>
                          Reubicar
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setEliminarId(fila.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ReubicarModal
        isOpen={!!reubicar}
        onClose={() => setReubicar(null)}
        onSubmit={guardarReubicacion}
        pendiente={reubicar}
      />

      <ConfirmModal
        isOpen={!!eliminarId}
        onClose={() => setEliminarId(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar de por ubicar"
        message="Esto no lo vuelve a una cuenta. Solo lo saca de esta lista."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  )
}
