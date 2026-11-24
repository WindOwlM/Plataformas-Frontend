import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Mail } from 'lucide-react'
import { useApi } from '../hooks/useApi'
import { registrarError } from '../lib/errorLog'
import VisorCorreos, { BotonesConectar, iniciarConexionCorreo } from '../components/correos/VisorCorreos'

const RUTA = '/dashboard/correos'

function IconoProveedor({ provider }) {
  return (
    <span
      className={`h-2.5 w-2.5 rounded-full shrink-0 ${provider === 'google' ? 'bg-red-500' : 'bg-sky-500'}`}
      title={provider === 'google' ? 'Gmail' : 'Outlook'}
    />
  )
}

export default function CorreosPage() {
  const { request } = useApi()
  const [searchParams, setSearchParams] = useSearchParams()
  const [vinculados, setVinculados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [seleccionado, setSeleccionado] = useState(null)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    const { data } = await request('/correos/vinculados', { silent: true })
    const lista = Array.isArray(data) ? [...data].sort((a, b) => a.correo.localeCompare(b.correo)) : []
    setVinculados(lista)
    setCargando(false)
    return lista
  }, [request])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Vuelta desde Google/Microsoft después de conectar un correo
  useEffect(() => {
    const conectado = searchParams.get('correo_conectado')
    const fallo = searchParams.get('correo_error')
    if (!conectado && !fallo) return
    if (fallo) {
      registrarError({ mensaje: `No se pudo conectar el correo: ${fallo}`, origen: 'Conectar correo' })
    } else {
      setAviso(`✅ ${conectado} conectado correctamente`)
      setTimeout(() => setAviso(''), 5000)
      cargar().then(() => setSeleccionado(conectado))
    }
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams, cargar])

  return (
    <div className="space-y-6">
      {aviso ? (
        <div className="rounded-xl border border-green-700 bg-green-900/30 p-3 text-sm text-green-300">{aviso}</div>
      ) : null}

      <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Correos conectados</h2>
            {!cargando ? <span className="text-xs text-gray-500">({vinculados.length})</span> : null}
          </div>
          <BotonesConectar request={request} ruta={RUTA} sugerido="microsoft" compacto />
        </div>

        {cargando ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </div>
        ) : vinculados.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-700 p-8 text-center">
            <p className="text-gray-400">Aún no hay correos conectados.</p>
            <p className="mt-1 text-sm text-gray-500">Pulsa + Outlook o + Gmail arriba.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {vinculados.map((v) => {
              const activo = seleccionado === v.correo
              return (
                <button
                  key={v.correo}
                  type="button"
                  onClick={() => setSeleccionado(v.correo)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition ${
                    activo
                      ? 'border-indigo-500 bg-indigo-500/15 text-white ring-2 ring-indigo-500/30'
                      : 'border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  <IconoProveedor provider={v.provider} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium break-all">{v.correo}</span>
                    {v.plataformas?.length ? (
                      <span className="block text-[11px] text-gray-500">{v.plataformas.join(' · ')}</span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {seleccionado ? (
        <section className="bg-gray-800 rounded-xl border border-gray-700 p-4 sm:p-6 space-y-3">
          <h3 className="text-white font-semibold break-all">Últimos correos de {seleccionado}</h3>
          <VisorCorreos
            key={seleccionado}
            request={request}
            correo={seleccionado}
            onReconectar={async () => {
              const v = vinculados.find((x) => x.correo === seleccionado)
              const provider = v?.provider || 'microsoft'
              await iniciarConexionCorreo(request, { provider, correo: seleccionado, ruta: RUTA })
            }}
            onDesconectado={() => {
              setSeleccionado(null)
              cargar()
            }}
          />
        </section>
      ) : null}
    </div>
  )
}
