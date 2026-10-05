import { useEffect, useMemo, useState } from 'react'
import { Loader2, MonitorPlay, UserPlus } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { fieldClass } from '../components/ui/fieldStyles'
import PuestoModal from '../components/dashboard/PuestoModal'
import Button from '../components/ui/Button'

function estadoBadge(estado) {
  const colors = {
    disponible: 'bg-green-500/20 text-green-400 border-green-500/30',
    vendida: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    vencida: 'bg-red-500/20 text-red-400 border-red-500/30',
    suspendida: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }
  return colors[estado] || colors.disponible
}

export default function CuentasPage() {
  const { request, loading } = useApi()
  const [plataformas, setPlataformas] = useState([])
  const [plataformaId, setPlataformaId] = useState('')
  const [cuentas, setCuentas] = useState([])
  const [puestoCuenta, setPuestoCuenta] = useState(null)

  async function cargarCuentas(idPlataforma = plataformaId) {
    if (!idPlataforma) {
      setCuentas([])
      return
    }
    const query = idPlataforma === 'todas' ? '' : `?plataforma=${idPlataforma}`
    const { data } = await request(`/cuentas${query}`)
    setCuentas(data || [])
  }

  useEffect(() => {
    request('/catalogos/plataformas').then(({ data }) => {
      if (data) setPlataformas(data)
    })
  }, [request])

  useEffect(() => {
    cargarCuentas(plataformaId)
  }, [plataformaId])

  async function guardarPuesto(puestoData) {
    const cuentaId = puestoCuenta?.id || puestoData.id_cuenta
    if (!cuentaId) return false

    const result = await request(`/cuentas/${cuentaId}/puestos`, {
      method: 'POST',
      body: JSON.stringify(puestoData),
    })
    if (result.error) return false
    await cargarCuentas()
    return true
  }

  const plataformaNombre = useMemo(() => {
    if (plataformaId === 'todas') return 'Todas las plataformas'
    return plataformas.find((p) => p.id === plataformaId)?.nombre_plat || ''
  }, [plataformaId, plataformas])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">Cuentas</h2>
        <p className="text-sm text-gray-400 mt-1">
          Elige una plataforma para ver sus cuentas en tabla
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 sm:p-5">
        <label htmlFor="plataforma" className="block text-sm font-medium text-gray-300 mb-2">
          Plataforma
        </label>
        <select
          id="plataforma"
          value={plataformaId}
          onChange={(e) => setPlataformaId(e.target.value)}
          className={`${fieldClass} max-w-md`}
        >
          <option value="">Selecciona una plataforma</option>
          <option value="todas">Todas las plataformas</option>
          {plataformas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre_plat}
            </option>
          ))}
        </select>
      </div>

      {!plataformaId ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <MonitorPlay className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Selecciona una plataforma para ver las cuentas</p>
        </div>
      ) : loading && cuentas.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : cuentas.length === 0 ? (
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-12 text-center">
          <p className="text-gray-400">No hay cuentas para {plataformaNombre}</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-300 font-medium">{plataformaNombre}</p>
            <p className="text-xs text-gray-500">{cuentas.length} cuenta{cuentas.length === 1 ? '' : 's'}</p>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="bg-gray-900/60 text-gray-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-medium">Correo</th>
                  {plataformaId === 'todas' && (
                    <th className="px-4 py-3 font-medium">Plataforma</th>
                  )}
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Vence</th>
                  <th className="px-4 py-3 font-medium">Costo</th>
                  <th className="px-4 py-3 font-medium">Puestos</th>
                  <th className="px-4 py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {cuentas.map((cuenta) => {
                  const puestos = cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []
                  return (
                    <tr key={cuenta.id} className="hover:bg-gray-700/40 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{cuenta.correo}</td>
                      {plataformaId === 'todas' && (
                        <td className="px-4 py-3 text-gray-300">
                          {cuenta.plataforma?.nombre_plat || '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-gray-300">
                        {cuenta.proveedor?.nombre_prov || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${estadoBadge(cuenta.estado)}`}>
                          {cuenta.estado || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                        {cuenta.fecha_vencimiento || 'Sin fecha'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {cuenta.precio_costo != null ? `$${cuenta.precio_costo}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{puestos.length}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => setPuestoCuenta(cuenta)}>
                          <UserPlus className="h-3.5 w-3.5" />
                          Asignar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PuestoModal
        isOpen={!!puestoCuenta}
        onClose={() => setPuestoCuenta(null)}
        onSubmit={guardarPuesto}
        cuenta={puestoCuenta}
      />
    </div>
  )
}
