// Avisos amarillos: algo se guardó bien pero hay que revisar algo
// (por ejemplo, una cuenta que quedó con más clientes que puestos).
// No van al registro de errores.

const oyentes = new Set()
let seq = 0

export function mostrarAviso(mensaje) {
  const texto = String(mensaje || '').trim()
  if (!texto) return
  seq += 1
  const nuevo = { id: `aviso-${Date.now()}-${seq}`, mensaje: texto, tipo: 'aviso' }
  oyentes.forEach((fn) => fn(nuevo))
}

export function suscribirAvisos(fn) {
  oyentes.add(fn)
  return () => oyentes.delete(fn)
}
