import { useState } from 'react'
import { useApi } from '../../hooks/useApi'

export default function CuentaCard({ cuenta, clientes, onEditPuesto, onDeletePuesto, onEditCuenta, onDeleteCuenta,onNewPuesto }) {
  const [showPassword, setShowPassword] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPass, setCopiedPass] = useState(false)
  const [loadingPassword, setLoadingPassword] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const { request } = useApi()

  async function copiarAlPortapapeles(texto, tipo) {
    try {
      await navigator.clipboard.writeText(texto)
      if (tipo === 'email') {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      } else {
        setCopiedPass(true)
        setTimeout(() => setCopiedPass(false), 2000)
      }
    } catch (err) {
      const textarea = document.createElement('textarea')
      textarea.value = texto
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      if (tipo === 'email') {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      } else {
        setCopiedPass(true)
        setTimeout(() => setCopiedPass(false), 2000)
      }
    }
  }

  async function fetchPassword() {
    if (passwordValue) {
      return passwordValue
    }

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
    if (password) {
      await copiarAlPortapapeles(password, 'password')
    }
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

  // La contraseña en texto plano NO se guarda en BD por seguridad
  // Pero si la cuenta fue creada recientemente, podemos mostrar un indicador
  // Para edición, el backend debe permitir actualizar la contraseña

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      {/* Header de la cuenta */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-400">
                {cuenta.plataforma?.nombre_plat?.charAt(0) || 'C'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-white font-medium">{cuenta.correo}</p>
                {/* Botón copiar correo */}
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(cuenta.correo, 'email')}
                  className={`p-1 rounded transition-colors relative ${
                    copiedEmail ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'
                  }`}
                  title="Copiar correo"
                >
                  {copiedEmail ? (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                  {copiedEmail && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-green-600 text-white text-[10px] rounded whitespace-nowrap">
                      ¡Correo copiado!
                    </span>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-400">
                {cuenta.plataforma?.nombre_plat} • {cuenta.proveedor?.nombre_prov}
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEstadoColor(cuenta.estado)}`}>
            {cuenta.estado}
          </span>
        </div>

        {/* Contraseña con copiar */}
        <div className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-3 border border-gray-700">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Contraseña</p>
            <p className="text-sm font-mono text-yellow-400 tracking-wider">
              Contrasena: {cuenta.contrasena_recuperable ? cuenta.contrasena_recuperable : 'N/A'}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">
              {showPassword ? 'La contraseña no se almacena en texto plano por seguridad' : 'Oculta'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
            
            <button
              type="button"
              onClick={handleCopyPassword}
              disabled={loadingPassword}
              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Copiar contraseña"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info adicional */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Vence: {cuenta.fecha_vencimiento || 'Sin fecha'}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Costo: ${cuenta.precio_costo}
          </span>
          {cuenta.notas && (
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {cuenta.notas}
            </span>
          )}
        </div>
      </div>

      {/* Puestos / Usuarios */}
      <div className="bg-gray-900/30">
        <div className="px-5 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Puestos ({puestos.length})
          </h4>
        </div> 
        <button
            type="button"
            onClick={() => onNewPuesto?.(cuenta)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar puesto
        </button>

        <div className="divide-y divide-gray-700/50">
          {puestos.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500 text-center">
              Sin puestos configurados
            </p>
          ) : (
            puestos.map((puesto, index) => (
              <div 
                key={puesto.id || index} 
                className={`px-5 py-3 flex items-center justify-between group ${
                  puesto.id_usuario ? 'hover:bg-gray-700/30' : 'hover:bg-gray-700/20'
                } transition-colors`}
              >
                <div className="flex items-center gap-3 flex-1">
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
                    
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {puesto.pin && (
                        <span className="flex items-center gap-1 font-mono">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          PIN: {puesto.pin}
                        </span>
                      )}
                      {puesto.vencimiento_usuario && (
                        <span className={`flex items-center gap-1 ${
                          new Date(puesto.vencimiento_usuario) < new Date() ? 'text-red-400' : ''
                        }`}>
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Vence: {puesto.vencimiento_usuario}
                        </span>
                      )}
                      {puesto.valor_venta > 0 && (
                        <span className="flex items-center gap-1 text-green-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          ${puesto.valor_venta}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onEditPuesto?.(cuenta, puesto)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                    title="Editar puesto"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePuesto?.(cuenta, puesto)}
                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Eliminar puesto"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-900/50 border-t border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Agregado: {cuenta.fecha_agregado || 'N/A'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEditCuenta?.(cuenta)}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Cuenta
          </button>
          <button
            type="button"
            onClick={() => onDeleteCuenta?.(cuenta)}
            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors flex items-center gap-1"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}