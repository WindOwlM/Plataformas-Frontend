import { useEffect, useState } from 'react'
import { Loader2, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import Button from '../components/ui/Button'
import ReubicarModal from '../components/dashboard/ReubicarModal'
import EditarPorUbicarModal from '../components/dashboard/EditarPorUbicarModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import FechaBadge from '../components/ui/FechaBadge'

export default function PorUbicarPage() {
  const { request, loading } = useApi()
  const [filas, setFilas] = useState([])
  const [reubicar, setReubicar] = useState(null)
  const [editar, setEditar] = useState(null)
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

  async function guardarEdicion(payload) {
    const result = await request(`/por-ubicar/${editar.id}`, {
      method: 'PATCH',
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
          Clientes sacados de una cuenta. Siguen contando en el dashboard si vencen hoy, mañana o ya vencieron.
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
          <div className="lg:hidden divide-y divide-gray-700">
            {filas.map((fila) => (
              <div key={fila.id} className="p-4 space-y-3">
                <div>
                  <p className="text-white font-medium">{fila.usuario?.nombre || '—'}</p>
                  <p className="text-xs text-gray-500">{fila.usuario?.numero_telefono || ''}</p>
                </div>
                <p className="text-sm text-gray-300">
                  {fila.plataforma?.nombre_plat || '—'}
                  {fila.cuenta?.correo ? ` · ${fila.cuenta.correo}` : ''}
                </p>
                <p className="text-xs text-gray-400">PIN {fila.pin || '—'}</p>
                <FechaBadge fecha={fila.vencimiento_usuario} empty="Sin fecha" />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditar(fila)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                  <Button size="sm" onClick={() => setReubicar(fila)}>
                    Reubicar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => setEliminarId(fila.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden lg:block overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left">
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
                    <td className="px-4 py-3">
                      <FechaBadge fecha={fila.vencimiento_usuario} empty="Sin fecha" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditar(fila)}>
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
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

      <EditarPorUbicarModal
        isOpen={!!editar}
        onClose={() => setEditar(null)}
        onSubmit={guardarEdicion}
        pendiente={editar}
      />

      <ConfirmModal
        isOpen={!!eliminarId}
        onClose={() => setEliminarId(null)}
        onConfirm={confirmarEliminar}
        title="Eliminar de por ubicar"
        message="Esto no lo vuelve a una cuenta. Solo lo saca de esta lista y deja de contar en vencimientos."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  )
}
