import { formatFecha } from './vencimientos'

export const DEFAULT_MAX_PUESTOS = 5

export function maxPuestosDe(plataforma) {
  const n = Number(plataforma?.max_puestos)
  if (Number.isFinite(n) && n > 0) return n
  if (String(plataforma?.nombre_plat || '').toLowerCase().includes('netflix')) return 5
  return DEFAULT_MAX_PUESTOS
}

export function puestosDe(cuenta) {
  return cuenta?.usuario_cuenta || cuenta?.usuarios_cuenta || []
}

export function cuentaLlena(cuenta) {
  return cuenta?.estado === 'llena' || cuenta?.estado === 'vendida'
}

export function etiquetaEstado(estado) {
  if (estado === 'vendida') return 'llena'
  return estado || 'disponible'
}

export function ordenarCuentasPorCupo(cuentas, idActual) {
  return [...cuentas].sort((a, b) => {
    if (idActual) {
      if (a.id === idActual) return -1
      if (b.id === idActual) return 1
    }
    const la = cuentaLlena(a) ? 1 : 0
    const lb = cuentaLlena(b) ? 1 : 0
    if (la !== lb) return la - lb
    return String(a.correo || '').localeCompare(String(b.correo || ''), 'es')
  })
}

export function etiquetaOpcionCuenta(cuenta) {
  const correo = cuenta.correo || 'Sin correo'
  const vence = cuenta.fecha_vencimiento
    ? formatFecha(cuenta.fecha_vencimiento)
    : 'sin fecha'
  const estado = etiquetaEstado(cuenta.estado)
  return `${correo} · vence ${vence} · ${estado}`
}
