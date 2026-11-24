import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Search, Unplug } from 'lucide-react'
import Button from '../ui/Button'
import { fieldClass } from '../ui/fieldStyles'

export function proveedorSugerido(correo) {
  const dominio = String(correo || '').toLowerCase().split('@')[1] || ''
  if (/^(gmail|googlemail)\.com$/.test(dominio)) return 'google'
  if (/^(hotmail|outlook|live|msn)\./.test(dominio)) return 'microsoft'
  return null
}

// Pide al backend el enlace de Google/Microsoft y abre esa página.
// Al terminar, el backend devuelve a `ruta` con ?correo_conectado=... o ?correo_error=...
export async function iniciarConexionCorreo(request, { provider, correo = '', ruta }) {
  const { data, error } = await request('/correos/conectar', {
    method: 'POST',
    body: JSON.stringify({ provider, correo, ruta }),
  })
  if (error || !data?.url) return error || 'No se pudo iniciar la conexión'
  window.location.href = data.url
  return null
}

function escaparHtml(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// El correo se muestra en un recuadro aislado (sin scripts ni acceso a la app)
function documentoCorreo(body) {
  const esHtml = /<[a-z][\s\S]*>/i.test(body || '')
  const contenido = esHtml
    ? body
    : `<pre style="white-space:pre-wrap;font-family:inherit;margin:0">${escaparHtml(body || '(Sin contenido)')}</pre>`
  return `<!doctype html><html><head><meta charset="utf-8"><base target="_blank">
<style>body{margin:0;padding:12px;font-family:system-ui,sans-serif;font-size:14px;color:#111;background:#fff;word-break:break-word}img{max-width:100%;height:auto}</style>
</head><body>${contenido}</body></html>`
}

function formatFechaCorreo(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function CorreoItem({ email, abierto, onToggle }) {
  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900/50 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-gray-700/40"
      >
        {abierto
          ? <ChevronDown className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
          : <ChevronRight className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-white font-medium break-words">{email.subject}</p>
          <p className="text-xs text-gray-400 break-all">
            {email.from}
            {email.date ? ` · ${formatFechaCorreo(email.date)}` : ''}
          </p>
        </div>
      </button>
      {abierto ? (
        <iframe
          title={email.subject}
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          srcDoc={documentoCorreo(email.body)}
          className="w-full h-96 bg-white border-t border-gray-700"
        />
      ) : null}
    </div>
  )
}

export function BotonesConectar({ request, correo = '', ruta, sugerido = proveedorSugerido(correo), compacto = false }) {
  const [conectando, setConectando] = useState('')
  const [error, setError] = useState('')

  async function conectar(provider) {
    setConectando(provider)
    setError('')
    const err = await iniciarConexionCorreo(request, { provider, correo, ruta })
    if (err) {
      setConectando('')
      setError(err)
    }
  }

  return (
    <div className="space-y-2">
      <div className={`flex ${compacto ? 'gap-2' : 'flex-col sm:flex-row gap-2'}`}>
        <Button
          type="button"
          size={compacto ? 'sm' : 'md'}
          variant={sugerido === 'google' ? 'secondary' : 'primary'}
          onClick={() => conectar('microsoft')}
          isLoading={conectando === 'microsoft'}
          disabled={!!conectando}
          className={compacto ? '' : 'flex-1'}
        >
          {compacto ? '+ Outlook' : 'Conectar con Outlook / Hotmail'}
        </Button>
        <Button
          type="button"
          size={compacto ? 'sm' : 'md'}
          variant={sugerido === 'google' ? 'primary' : 'secondary'}
          onClick={() => conectar('google')}
          isLoading={conectando === 'google'}
          disabled={!!conectando}
          className={compacto ? '' : 'flex-1'}
        >
          {compacto ? '+ Gmail' : 'Conectar con Gmail'}
        </Button>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}

// Lista de los últimos correos de un buzón conectado, con buscador
export default function VisorCorreos({ request, correo, onDesconectado, onReconectar }) {
  const [emails, setEmails] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [abiertoId, setAbiertoId] = useState(null)

  const cargar = useCallback(async (query = '') => {
    if (!correo) return
    setCargando(true)
    setError('')
    const { data, error: err } = await request('/correos/leer', {
      method: 'POST',
      silent: true,
      body: JSON.stringify({ correo, query, max: 5 }),
    })
    setCargando(false)
    if (err) {
      setError(err)
      setEmails([])
      return
    }
    const lista = data?.emails || []
    setEmails(lista)
    setAbiertoId(lista[0]?.id || null)
  }, [correo, request])

  useEffect(() => {
    setEmails([])
    setBusqueda('')
    setAbiertoId(null)
    cargar('')
  }, [cargar])

  async function desconectar() {
    if (!window.confirm(`¿Desconectar ${correo}? Para volver a ver sus correos tendrás que conectarlo de nuevo.`)) return
    const { error: err } = await request(`/correos/vinculados/${encodeURIComponent(correo)}`, { method: 'DELETE' })
    if (!err) onDesconectado?.()
  }

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          cargar(busqueda.trim())
        }}
      >
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar (ej: netflix, código, hogar)…"
          className={fieldClass}
        />
        <Button type="submit" variant="secondary" title={busqueda.trim() ? 'Buscar' : 'Actualizar'} disabled={cargando}>
          {busqueda.trim() ? <Search className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </form>

      {cargando ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando correos…
        </div>
      ) : error ? (
        <div className="space-y-2">
          <p className="text-sm text-red-400">{error}</p>
          {onReconectar ? (
            <Button type="button" size="sm" variant="secondary" onClick={onReconectar}>
              Volver a conectar el correo
            </Button>
          ) : null}
        </div>
      ) : emails.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">No se encontraron correos.</p>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <CorreoItem
              key={email.id}
              email={email}
              abierto={abiertoId === email.id}
              onToggle={() => setAbiertoId((prev) => (prev === email.id ? null : email.id))}
            />
          ))}
        </div>
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={desconectar}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-400"
          title="Quitar el permiso guardado para este correo"
        >
          <Unplug className="h-3.5 w-3.5" />
          Desconectar correo
        </button>
      </div>
    </div>
  )
}
