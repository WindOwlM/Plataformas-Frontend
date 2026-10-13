export const DEFAULT_MAX_PUESTOS = 5

export function maxPuestosDe(plataforma) {
  const n = Number(plataforma?.max_puestos)
  if (Number.isFinite(n) && n > 0) return n
  if (String(plataforma?.nombre_plat || '').toLowerCase().includes('netflix')) return 5
  return DEFAULT_MAX_PUESTOS
}

export function maxPuestosCuenta(cuenta, plataformas = []) {
  const plat =
    cuenta?.plataforma ||
    plataformas.find((p) => p.id === cuenta?.id_plataforma)
  if (cuenta?.max_puestos) return Number(cuenta.max_puestos)
  return maxPuestosDe(plat)
}

export function ocupadosCuenta(cuenta) {
  if (cuenta?.ocupados != null) return Number(cuenta.ocupados)
  return (cuenta?.usuarios_cuenta || cuenta?.usuario_cuenta || []).length
}

export function cuentaLlena(cuenta, plataformas = []) {
  return ocupadosCuenta(cuenta) >= maxPuestosCuenta(cuenta, plataformas)
}

export function etiquetaEstado(estado) {
  if (estado === 'vendida' || estado === 'llena') return 'llena'
  return estado || 'disponible'
}
