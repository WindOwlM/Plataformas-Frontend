export const MEDIOS_PAGO = ['Nequi', 'Bancolombia', 'Daviplata', 'Llave', 'Efectivo', 'Otro']

export function pagoInicial() {
  return { modo: 'pagado', monto: '', medio: '', editado: false }
}

// Lo que se envía al backend junto con la renovación
export function pagoParaEnviar(pago, detalle = []) {
  if (!pago || pago.modo === 'no') return { registrar: false }
  return {
    registrar: true,
    estado: pago.modo === 'pendiente' ? 'pendiente' : 'pagado',
    monto: Number(pago.monto) || 0,
    medio: pago.modo === 'pagado' ? pago.medio || null : null,
    detalle,
  }
}

export function errorPago(pago) {
  if (!pago || pago.modo === 'no') return ''
  if (pago.monto === '' || pago.monto === null || Number.isNaN(Number(pago.monto))) {
    return 'Escribe el monto del pago (o marca "No registrar").'
  }
  if (Number(pago.monto) < 0) return 'El monto no puede ser negativo.'
  return ''
}
