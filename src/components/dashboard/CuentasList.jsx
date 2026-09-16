import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import CuentaCard from './CuentaCard'
import CuentaModal from './CuentaModal'
import ConfirmModal from '../ui/ConfirmModal'

export default function CuentasList() {
  const [cuentas, setCuentas] = useState([])
  const [correoFilter, setCorreoFilter] = useState('')
  const [usuarioFilter, setUsuarioFilter] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [usuarioFechaInicio, setUsuarioFechaInicio] = useState('')
  const [usuarioFechaFin, setUsuarioFechaFin] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [cuentaEditando, setCuentaEditando] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const { request, loading } = useApi()

  useEffect(() => {
    cargarCuentas()
  }, [])

  async function cargarCuentas() {
    const params = new URLSearchParams()
    if (correoFilter) params.append('correo', correoFilter)
    if (usuarioFilter) params.append('usuario', usuarioFilter)
    if (fechaInicio) params.append('fecha_inicio', fechaInicio)
    if (fechaFin) params.append('fecha_fin', fechaFin)
    if (usuarioFechaInicio) params.append('usuario_fecha_inicio', usuarioFechaInicio)
    if (usuarioFechaFin) params.append('usuario_fecha_fin', usuarioFechaFin)

    const query = params.toString() ? `?${params.toString()}` : ''
    const { data } = await request(`/cuentas${query}`)
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
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 bg-gray-800 p-3 rounded">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-xs text-gray-400">Buscar por correo</label>
                <input
                  type="text"
                  placeholder="ej. usuario@dominio.com"
                  value={correoFilter}
                  onChange={(e) => setCorreoFilter(e.target.value)}
                  className="w-full mt-1 text-sm bg-transparent placeholder-gray-500 outline-none text-white px-2 py-1 rounded"
                  title="Filtra cuentas por correo (substring, case-insensitive)"
                />
                <p className="text-[11px] text-gray-500 mt-1">Busca coincidencias parciales en el campo correo.</p>
              </div>

              <div>
                <label className="text-xs text-gray-400">Buscar por usuario</label>
                <input
                  type="text"
                  placeholder="Nombre del usuario asignado"
                  value={usuarioFilter}
                  onChange={(e) => setUsuarioFilter(e.target.value)}
                  className="w-full mt-1 text-sm bg-transparent placeholder-gray-500 outline-none text-white px-2 py-1 rounded"
                  title="Filtra cuentas por nombre de usuario dentro de los puestos"
                />
                <p className="text-[11px] text-gray-500 mt-1">Busca en los nombres de los usuarios asignados a puestos.</p>
              </div>

              <div>
                <label className="text-xs text-gray-400">Vencimiento de cuenta (desde / hasta)</label>
                <div className="flex gap-2 mt-1">
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-1/2 text-sm bg-transparent outline-none text-white px-2 py-1 rounded" />
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-1/2 text-sm bg-transparent outline-none text-white px-2 py-1 rounded" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Rango para la fecha de vencimiento de la cuenta.</p>
              </div>

              <div>
                <label className="text-xs text-gray-400">Vencimiento de puesto (desde / hasta)</label>
                <div className="flex gap-2 mt-1">
                  <input type="date" value={usuarioFechaInicio} onChange={(e) => setUsuarioFechaInicio(e.target.value)} className="w-1/2 text-sm bg-transparent outline-none text-white px-2 py-1 rounded" />
                  <input type="date" value={usuarioFechaFin} onChange={(e) => setUsuarioFechaFin(e.target.value)} className="w-1/2 text-sm bg-transparent outline-none text-white px-2 py-1 rounded" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Rango para la fecha de vencimiento de los puestos (usuarios).</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <button onClick={cargarCuentas} className="px-4 py-1 bg-indigo-600 rounded text-sm">Filtrar</button>
              <button
                onClick={() => {
                  setCorreoFilter('')
                  setUsuarioFilter('')
                  setFechaInicio('')
                  setFechaFin('')
                  setUsuarioFechaInicio('')
                  setUsuarioFechaFin('')
                  cargarCuentas()
                }}
                className="px-4 py-1 bg-gray-700 rounded text-sm"
              >
                Limpiar
              </button>
            </div>
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