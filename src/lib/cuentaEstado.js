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
