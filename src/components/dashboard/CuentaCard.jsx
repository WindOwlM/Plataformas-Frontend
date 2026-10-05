import { useState } from 'react'
import {
  Copy, Check, Eye, EyeOff, Pencil, Trash2, Plus, Calendar, Banknote, StickyNote, Users,
} from 'lucide-react'
import { useApi } from '../../hooks/useApi'

export default function CuentaCard({ cuenta, onEditPuesto, onDeletePuesto, onEditCuenta, onDeleteCuenta, onNewPuesto }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const { request } = useApi()

  async function copiarAlPortapapeles(texto, tipo) {
    try {
      await navigator.clipboard.writeText(texto)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = texto
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    if (tipo === 'email') {
      setCopiedEmail(true)
      setTimeout(() => setCopiedEmail(false), 2000)
    } else {
      setCopiedPass(true)
      setTimeout(() => setCopiedPass(false), 2000)
    }
  }

  async function fetchPassword() {
    if (passwordValue) return passwordValue
    if (!cuenta?.id) return ''

    setLoadingPassword(true)
    const { data, error } = await request(`/cuentas/${cuenta.id}/contrasena`)
    setLoadingPassword(false)

    if (error) {
      console.error('Error fetching password:', error)
      return ''
    }

    setPasswordValue(data?.contrasena || '')
    return data?.contrasena || ''
  }

  async function handleCopyPassword() {
    const password = await fetchPassword()
    if (password) await copiarAlPortapapeles(password, 'password')
  }

  async function handleTogglePassword() {
    if (!showPassword) await fetchPassword()
    setShowPassword((prev) => !prev)
  }

  function getEstadoColor(estado) {
    const colors = {
      disponible: 'bg-green-500/20 text-green-400 border-green-500/30',
      vendida: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      vencida: 'bg-red-500/20 text-red-400 border-red-500/30',
      suspendida: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    }
    return colors[estado] || colors.disponible
  }

  const puestos = cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []
  const displayedPassword = showPassword
    ? (passwordValue || cuenta.contrasena_recuperable || 'No disponible')
    : '••••••••'

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 shrink-0 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-400">
                {cuenta.plataforma?.nombre_plat?.charAt(0) || 'C'}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-medium truncate">{cuenta.correo}</p>
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(cuenta.correo, 'email')}
                  className={`p-1 rounded transition-colors relative shrink-0 ${
                    copiedEmail ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Copiar correo"
                >
                  {copiedEmail ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {cuenta.plataforma?.nombre_plat} • {cuenta.proveedor?.nombre_prov}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${getEstadoColor(cuenta.estado)}`}>
            {cuenta.estado}
          </span>
        </div>

        <div className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1">Contraseña</p>
            <p className="text-sm font-mono text-yellow-400 tracking-wider truncate">
              {loadingPassword ? 'Cargando...' : displayedPassword}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleTogglePassword}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleCopyPassword}
              disabled={loadingPassword}
              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                copiedPass ? 'text-green-400' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
              title="Copiar contraseña"
            >
              {copiedPass ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Vence: {cuenta.fecha_vencimiento || 'Sin fecha'}
          </span>
          <span className="flex items-center gap-1">
            <Banknote className="h-3 w-3" />
            Costo: ${cuenta.precio_costo}
          </span>
          {cuenta.notas && (
            <span className="flex items-center gap-1 min-w-0 max-w-full" title={cuenta.notas}>
              <StickyNote className="h-3 w-3 shrink-0" />
              <span className="truncate">{cuenta.notas}</span>
            </span>
          )}
        </div>
      </div>

      <div className="bg-gray-900/30 flex-1">
        <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            Puestos ({puestos.length})
          </h4>
          <button
            type="button"
            onClick={() => onNewPuesto?.(cuenta)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 shrink-0"
          >
            <Plus className="h-3 w-3" />
            Agregar puesto
          </button>
        </div>

        <div className="divide-y divide-gray-700/50">
          {puestos.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500 text-center">
              Sin puestos configurados
            </p>
          ) : (
            puestos.map((puesto, index) => (
              <div
                key={puesto.id || index}
                className="px-5 py-3 flex items-center justify-between gap-2 group hover:bg-gray-700/20 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    puesto.id_usuario
                      ? puesto.estado === 'activa' ? 'bg-green-400' : 'bg-yellow-400'
                      : 'bg-gray-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {puesto.usuario?.nombre || 'Vacío'}
                      </span>
                      {puesto.es_combo && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                          Combo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                      {puesto.pin && <span className="font-mono">PIN: {puesto.pin}</span>}
                      {puesto.vencimiento_usuario && (
                        <span className={new Date(puesto.vencimiento_usuario) < new Date() ? 'text-red-400' : ''}>
                          Vence: {puesto.vencimiento_usuario}
                        </span>
                      )}
                      {puesto.valor_venta > 0 && (
                        <span className="text-green-400">${puesto.valor_venta}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEditPuesto?.(cuenta, puesto)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="Editar puesto"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePuesto?.(cuenta, puesto)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Eliminar puesto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="px-5 py-3 bg-gray-900/50 border-t border-gray-700 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-500 truncate">
          Agregado: {cuenta.fecha_agregado || 'N/A'}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onEditCuenta?.(cuenta)}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onDeleteCuenta?.(cuenta)}
            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
