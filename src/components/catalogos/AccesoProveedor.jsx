import { useState } from 'react'
import { Check, Copy, ExternalLink, Eye, EyeOff, KeyRound, User } from 'lucide-react'

function BotonCopiar({ texto, titulo }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <button
      type="button"
      onClick={copiar}
      className={`p-1 rounded shrink-0 ${copiado ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}
      title={copiado ? '¡Copiado!' : titulo}
    >
      {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function textoUrl(url) {
  return String(url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')
}

// Datos de acceso a la tienda del proveedor: solo consulta
export default function AccesoProveedor({ acceso }) {
  const [verClave, setVerClave] = useState(false)
  if (!acceso) return null
  const { url, usuario, contrasena } = acceso

  return (
    <div className="mt-2 rounded-lg border border-gray-700 bg-gray-900/50 px-3 py-2 space-y-1 text-xs">
      {url ? (
        <div className="flex items-center gap-1.5 min-w-0">
          <ExternalLink className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline break-all"
          >
            {textoUrl(url)}
          </a>
        </div>
      ) : null}
      {usuario ? (
        <div className="flex items-center gap-1.5 min-w-0">
          <User className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span className="text-gray-200 break-all">{usuario}</span>
          <BotonCopiar texto={usuario} titulo="Copiar correo" />
        </div>
      ) : null}
      {contrasena ? (
        <div className="flex items-center gap-1.5 min-w-0">
          <KeyRound className="h-3.5 w-3.5 text-gray-500 shrink-0" />
          <span className="text-gray-200 font-mono break-all">{verClave ? contrasena : '••••••••'}</span>
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="p-1 rounded text-gray-500 hover:text-white shrink-0"
            title={verClave ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {verClave ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <BotonCopiar texto={contrasena} titulo="Copiar contraseña" />
        </div>
      ) : null}
    </div>
  )
}
