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
  const max = Number(cuenta?.max_puestos)
  const ocupados = Number(cuenta?.ocupados)
  if (Number.isFinite(max) && max > 0 && Number.isFinite(ocupados)) {
    return ocupados >= max
  }
  return cuenta?.estado === 'llena' || cuenta?.estado === 'vendida'
}

export function cuentaSinVencimiento(cuenta) {
  return !/^\d{4}-\d{2}-\d{2}$/.test(String(cuenta?.fecha_vencimiento || '').slice(0, 10))
}

export function cuentaInhabilitada(cuenta) {
  const e = String(cuenta?.estado || '').toLowerCase()
  return e === 'inhabilitada' || e === 'inactiva' || e === 'suspendida'
}

export function cuentaNoAsignable(cuenta) {
  return cuentaLlena(cuenta) || cuentaSinVencimiento(cuenta) || cuentaInhabilitada(cuenta)
}

export function etiquetaEstado(estado) {
  if (estado === 'vendida') return 'llena'
  if (estado === 'inactiva' || estado === 'suspendida') return 'inhabilitada'
  return estado || 'disponible'
}

export function ordenarCuentasPorCupo(cuentas, idActual) {
  return [...cuentas].sort((a, b) => {
    if (idActual) {
      if (a.id === idActual) return -1
      if (b.id === idActual) return 1
    }
    const la = cuentaNoAsignable(a) ? 1 : 0
    const lb = cuentaNoAsignable(b) ? 1 : 0
    if (la !== lb) return la - lb
    return String(a.correo || '').localeCompare(String(b.correo || ''), 'es')
  })
}

export function etiquetaOpcionCuenta(cuenta) {
  const correo = cuenta.correo || 'Sin correo'
  const vence = cuenta.fecha_vencimiento
    ? formatFecha(cuenta.fecha_vencimiento)
    : 'sin fecha'
  const estado = cuentaSinVencimiento(cuenta)
    ? 'sin vencimiento'
    : etiquetaEstado(cuenta.estado)
  return `${correo} · vence ${vence} · ${estado}`
}
