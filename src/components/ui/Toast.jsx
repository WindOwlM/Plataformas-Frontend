import { useEffect, useRef, useState } from 'react'
import { CircleAlert, TriangleAlert, X } from 'lucide-react'
import { suscribirErrores } from '../../lib/errorLog'
import { suscribirAvisos } from '../../lib/avisos'

const DURACION_MS = 8000
const DURACION_AVISO_MS = 15000

// Avisos rojos que aparecen arriba a la derecha cuando algo sale mal.
export default function ErrorToasts() {
  const [visibles, setVisibles] = useState([])
  const timers = useRef(new Map())

  useEffect(() => {
    const mapa = timers.current
    const agregar = (nuevo, duracion) => {
      setVisibles((prev) => [nuevo, ...prev].slice(0, 4))
      const t = window.setTimeout(() => {
        setVisibles((prev) => prev.filter((e) => e.id !== nuevo.id))
        mapa.delete(nuevo.id)
      }, duracion)
      mapa.set(nuevo.id, t)
    }
    const quitarSus = suscribirErrores((_estado, nuevo) => {
      if (nuevo) agregar(nuevo, DURACION_MS)
    })
    const quitarAvisos = suscribirAvisos((nuevo) => agregar(nuevo, DURACION_AVISO_MS))
    return () => {
      quitarSus()
      quitarAvisos()
      mapa.forEach((t) => window.clearTimeout(t))
      mapa.clear()
    }
  }, [])

  function cerrar(id) {
    window.clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setVisibles((prev) => prev.filter((e) => e.id !== id))
  }

  if (visibles.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {visibles.map((e) => e.tipo === 'aviso' ? (
        <div
          key={e.id}
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-950/95 p-3 text-amber-200 shadow-lg shadow-amber-900/30"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-100 break-words">{e.mensaje}</p>
          </div>
          <button
            type="button"
            onClick={() => cerrar(e.id)}
            className="rounded p-1 text-amber-300 hover:bg-amber-500/20 hover:text-white"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          key={e.id}
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/95 p-3 text-red-200 shadow-lg shadow-red-900/30"
        >
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-100 break-words">{e.mensaje}</p>
            {e.origen ? <p className="mt-0.5 text-xs text-red-300/80 truncate">{e.origen}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => cerrar(e.id)}
            className="rounded p-1 text-red-300 hover:bg-red-500/20 hover:text-white"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
