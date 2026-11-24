import { useEffect, useRef, useState } from 'react'
import { CircleAlert, Trash2, X } from 'lucide-react'
import {
  limpiarErrores,
  marcarLeidos,
  obtenerEstado,
  suscribirErrores,
} from '../../lib/errorLog'

function formatHora(ms) {
  return new Date(ms).toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

// Botón de la barra superior: se pone ROJO cuando hay errores nuevos
// y abre el registro con los últimos errores.
export default function ErroresButton() {
  const [estado, setEstado] = useState(obtenerEstado)
  const [abierto, setAbierto] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => suscribirErrores((actual) => setEstado({ ...actual })), [])

  useEffect(() => {
    if (!abierto) return
    function fuera(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    return () => document.removeEventListener('mousedown', fuera)
  }, [abierto])

  function alternar() {
    const abrir = !abierto
    setAbierto(abrir)
    if (abrir) marcarLeidos()
  }

  const { errores, noLeidos } = estado
  const hayNuevos = noLeidos > 0

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={alternar}
        className={`relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          hayNuevos
            ? 'bg-red-600/20 text-red-300 hover:bg-red-600/30'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
        title="Registro de errores"
      >
        <CircleAlert className="h-4 w-4" />
        <span className="hidden sm:inline">Errores</span>
        {hayNuevos ? (
          <span className="min-w-5 rounded-full bg-red-600 px-1.5 text-center text-xs font-bold text-white">
            {noLeidos > 9 ? '9+' : noLeidos}
          </span>
        ) : null}
      </button>

      {abierto ? (
        <div className="absolute right-0 mt-2 w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-800 px-3 py-2">
            <p className="text-sm font-semibold text-gray-200">Registro de errores</p>
            <div className="flex items-center gap-1">
              {errores.length > 0 ? (
                <button
                  type="button"
                  onClick={limpiarErrores}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-800 hover:text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Limpiar
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-white"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto custom-scrollbar p-2">
            {errores.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-gray-500">Sin errores registrados.</p>
            ) : (
              <ul className="space-y-2">
                {errores.map((e) => (
                  <li key={e.id} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <p className="text-sm font-medium text-red-300 break-words">{e.mensaje}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{formatHora(e.fecha)}</p>
                    {e.origen || e.detalle ? (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-300">
                          Detalle técnico (para soporte)
                        </summary>
                        <p className="mt-1 font-mono text-[11px] text-gray-400 break-all whitespace-pre-wrap">
                          {[e.origen, e.detalle].filter(Boolean).join('\n')}
                        </p>
                      </details>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
