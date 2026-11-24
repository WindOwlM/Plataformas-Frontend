// Registro de errores de la app: guarda los últimos errores (también en el
// navegador, para que no se pierdan al recargar) y avisa a quien escuche
// (los avisos rojos y el panel "Errores" de la barra superior).

const STORAGE_KEY = 'plataformas.errores'
const MAX_ERRORES = 50

let errores = cargar()
let noLeidos = 0
const oyentes = new Set()

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const lista = raw ? JSON.parse(raw) : []
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function guardar() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(errores))
  } catch {
    // sin espacio o modo privado: se mantiene solo en memoria
  }
}

function avisar(nuevo) {
  const estado = { errores, noLeidos }
  oyentes.forEach((fn) => fn(estado, nuevo))
}

let seq = 0

export function registrarError({ mensaje, detalle = '', origen = '' }) {
  const texto = String(mensaje || 'Error desconocido')
  const ahora = Date.now()
  // Evita repetir el mismo error varias veces seguidas en pocos segundos.
  const ultimo = errores[0]
  if (ultimo && ultimo.mensaje === texto && ultimo.origen === origen && ahora - ultimo.fecha < 3000) {
    return
  }
  seq += 1
  const nuevo = { id: `${ahora}-${seq}`, fecha: ahora, mensaje: texto, detalle: String(detalle || ''), origen }
  errores = [nuevo, ...errores].slice(0, MAX_ERRORES)
  noLeidos += 1
  guardar()
  console.error(`%c✖ ${texto}`, 'color:#f87171;font-weight:bold', origen, detalle)
  avisar(nuevo)
}

export function obtenerEstado() {
  return { errores, noLeidos }
}

export function marcarLeidos() {
  noLeidos = 0
  avisar(null)
}

export function limpiarErrores() {
  errores = []
  noLeidos = 0
  guardar()
  avisar(null)
}

export function suscribirErrores(fn) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}

let globalesInstalados = false

// Errores de JavaScript que no maneja ninguna pantalla.
export function instalarCapturaGlobal() {
  if (globalesInstalados || typeof window === 'undefined') return
  globalesInstalados = true
  window.addEventListener('error', (e) => {
    registrarError({
      mensaje: e.message || 'Error inesperado en la página',
      detalle: e.error?.stack || `${e.filename || ''}:${e.lineno || ''}`,
      origen: 'página',
    })
  })
  window.addEventListener('unhandledrejection', (e) => {
    const razon = e.reason
    registrarError({
      mensaje: razon?.message || String(razon || 'Error inesperado'),
      detalle: razon?.stack || '',
      origen: 'página',
    })
  })
}
