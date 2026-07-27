import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import CuentaCard from './CuentaCard'
import CuentaModal from './CuentaModal'
import ConfirmModal from '../ui/ConfirmModal'

export default function CuentasList() {
  const [cuentas, setCuentas] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cuentaEditando, setCuentaEditando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { request, loading } = useApi()

  useEffect(() => {
    cargarCuentas()
  }, [])

  async function cargarCuentas() {
    const { data } = await request('/cuentas')
    if (data) setCuentas(data)
  }

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

  function handleEditCuenta(cuenta) {
    setCuentaEditando(cuenta)
    setIsModalOpen(true)
  }

  function handleNewCuenta() {
    setCuentaEditando(null)
    setIsModalOpen(true)
  }

  function handleNewPuesto(cuenta) {
    setCuentaEditando({
      ...cuenta,
      usuarios_cuenta: [
        ...(cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []),
        { id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' },
      ],
    })
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Cuentas de Streaming</h2>
          <p className="text-sm text-gray-400 mt-1">{cuentas.length} cuentas registradas</p>
        </div>
        <button
          onClick={handleNewCuenta}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Cuenta
        </button>
      </div>

      {loading && cuentas.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        </div>
      ) : cuentas.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">No hay cuentas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cuentas.map((cuenta) => (
            <CuentaCard
              key={cuenta.id}
              cuenta={cuenta}
              onEditPuesto={(c, p) => {
                setCuentaEditando({ ...c, puestoEditando: p })
                setIsModalOpen(true)
              }}
              onDeletePuesto={(c, p) => setConfirmDelete({ type: 'puesto', puesto: p })}
              onEditCuenta={handleEditCuenta}
              onDeleteCuenta={(c) => setConfirmDelete({ type: 'cuenta', cuenta: c })}
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

      {confirmDelete && (
        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            if (confirmDelete.type === 'puesto') {
              // Eliminar puesto
            } else {
              eliminarCuenta(confirmDelete.cuenta)
            }
          }}
          title={confirmDelete.type === 'puesto' ? 'Eliminar puesto' : 'Eliminar cuenta'}
          message={confirmDelete.type === 'puesto' ? '¿Eliminar este puesto?' : `¿Eliminar ${confirmDelete.cuenta.correo}?`}
          confirmText="Eliminar"
          variant="danger"
        />
      )}
    </div>
  )
}