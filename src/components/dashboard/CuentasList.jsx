import { useState, useEffect, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import CuentaCard from './CuentaCard'
import CuentaModal from './CuentaModal'
import PuestoModal from './PuestoModal'
import ConfirmModal from '../ui/ConfirmModal'
import QuitarClienteModal from './QuitarClienteModal'
import Button from '../ui/Button'

export default function CuentasList() {
  const [cuentas, setCuentas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cuentaEditando, setCuentaEditando] = useState(null)
  const [puestoCuenta, setPuestoCuenta] = useState(null)
  const [puestoEditando, setPuestoEditando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { request, loading } = useApi()

  const cargarCuentas = useCallback(async () => {
    const { data } = await request('/cuentas')
    if (data) setCuentas(data)
  }, [request])

  useEffect(() => {
    cargarCuentas()
  }, [cargarCuentas])

  async function guardarCuenta(cuentaData) {
    if (cuentaEditando) {
      const result = await request(`/cuentas/${cuentaEditando.id}`, {
        method: 'PATCH',
        body: JSON.stringify(cuentaData),
      })

      if (!result.error) {
        setCuentas((prev) =>
          prev.map((cuenta) =>
            cuenta.id === cuentaEditando.id
              ? {
                  ...cuenta,
                  ...cuentaData,
                  usuarios_cuenta: cuentaData.usuarios_cuenta || cuentaData.puestos || cuenta.usuarios_cuenta || cuenta.usuario_cuenta || [],
                  usuario_cuenta: cuentaData.usuario_cuenta || cuentaData.puestos || cuenta.usuarios_cuenta || cuenta.usuario_cuenta || [],
                }
              : cuenta
          )
        )
        await cargarCuentas()
      }
    } else {
      const result = await request('/cuentas/crear', {
        method: 'POST',
        body: JSON.stringify(cuentaData),
      })

      if (!result.error) await cargarCuentas()
    }

    setIsModalOpen(false)
    setCuentaEditando(null)
  }

  async function eliminarCuenta(cuenta) {
    const { error } = await request(`/cuentas/${cuenta.id}`, { method: 'DELETE' })
    if (!error) {
      setCuentas(cuentas.filter(c => c.id !== cuenta.id))
    }
    setConfirmDelete(null)
  }

  const handleEditCuenta = useCallback((cuenta) => {
    setCuentaEditando(cuenta)
    setIsModalOpen(true)
  }, [])

  const handleNewCuenta = useCallback(() => {
    setCuentaEditando(null)
    setIsModalOpen(true)
  }, [])

  const handleNewPuesto = useCallback((cuenta) => {
    setPuestoCuenta(cuenta)
    setPuestoEditando(null)
  }, [])

  const handleEditPuesto = useCallback((c, p) => {
    setPuestoCuenta(c)
    setPuestoEditando(p)
  }, [])

  const handleDeletePuesto = useCallback((c, p) => {
    setConfirmDelete({ type: 'puesto', cuenta: c, puesto: p })
  }, [])

  const handleDeleteCuenta = useCallback((c) => {
    setConfirmDelete({ type: 'cuenta', cuenta: c })
  }, [])

  async function guardarPuesto(puestoData) {
    const cuentaId = puestoCuenta?.id || puestoData.id_cuenta
    if (!cuentaId) return false

    const result = puestoData.id
      ? await request(`/cuentas/${cuentaId}/puestos/${puestoData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(puestoData),
        })
      : await request(`/cuentas/${cuentaId}/puestos`, {
          method: 'POST',
          body: JSON.stringify(puestoData),
        })

    if (result.error) return false
    await cargarCuentas()
    return true
  }

  async function quitarPuesto(accion) {
    const { cuenta, puesto } = confirmDelete || {}
    if (!cuenta?.id || !puesto?.id) return
    const url = `/cuentas/${cuenta.id}/puestos/${puesto.id}${accion === 'ubicar' ? '/ubicar' : ''}`
    const { error } = await request(url, { method: accion === 'ubicar' ? 'POST' : 'DELETE' })
    if (!error) await cargarCuentas()
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Cuentas de streaming</h2>
          <p className="text-sm text-gray-400 mt-1">{cuentas.length} cuentas registradas</p>
        </div>
        <Button onClick={handleNewCuenta}>
          <Plus className="h-4 w-4" />
          Nueva cuenta
        </Button>
      </div>

      {loading && cuentas.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : cuentas.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">No hay cuentas registradas</p>
          <p className="text-sm text-gray-500 mt-1">Crea una cuenta para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cuentas.map((cuenta) => (
            <CuentaCard
              key={cuenta.id}
              cuenta={cuenta}
              onEditPuesto={handleEditPuesto}
              onDeletePuesto={handleDeletePuesto}
              onEditCuenta={handleEditCuenta}
              onDeleteCuenta={handleDeleteCuenta}
              onNewPuesto={handleNewPuesto}
            />
          ))}
        </div>
      )}

      <CuentaModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCuentaEditando(null) }}
        onSubmit={guardarCuenta}
        cuenta={cuentaEditando}
      />

      <PuestoModal
        isOpen={!!puestoCuenta}
        onClose={() => {
          setPuestoCuenta(null)
          setPuestoEditando(null)
        }}
        onSubmit={guardarPuesto}
        cuenta={puestoCuenta}
        puesto={puestoEditando}
      />

      <QuitarClienteModal
        isOpen={confirmDelete?.type === 'puesto'}
        onClose={() => setConfirmDelete(null)}
        onEliminar={() => quitarPuesto('eliminar')}
        onUbicar={() => quitarPuesto('ubicar')}
        nombre={confirmDelete?.puesto?.usuario?.nombre}
        correo={confirmDelete?.cuenta?.correo}
      />

      {confirmDelete?.type === 'cuenta' && (
        <ConfirmModal
          isOpen
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => eliminarCuenta(confirmDelete.cuenta)}
          title="Eliminar cuenta"
          message={`¿Eliminar ${confirmDelete.cuenta.correo}?`}
          confirmText="Eliminar"
          variant="danger"
        />
      )}
    </div>
  )
}
