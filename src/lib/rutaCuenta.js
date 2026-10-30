export function rutaCuentaDestino(cuenta) {
  const params = new URLSearchParams()
  if (cuenta?.id_plataforma) params.set('plataforma', cuenta.id_plataforma)
  if (cuenta?.correo) params.set('correo', cuenta.correo)
  if (cuenta?.id) params.set('cuenta', cuenta.id)
  const query = params.toString()
  return query ? `/dashboard/cuentas?${query}` : '/dashboard/cuentas'
}
