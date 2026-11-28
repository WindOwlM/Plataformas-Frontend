export const MEDIOS_PAGO = ['Nequi', 'Bancolombia', 'Daviplata', 'Llave', 'Efectivo', 'Otro']

// modo: 'pagado' | 'parcial' | 'pendiente' (fiado) | 'no'
// monto: en 'pagado' lo recibido; en 'parcial' lo que pagó ahora. El fiado usa siempre el total.
export function pagoInicial() {
  return { modo: 'pagado', monto: '', medio: '', editado: false, usarSaldo: false }
}

// Cuánto saldo a favor se usa y cuánto queda por pagar
export function calcularSaldo(pago, total = 0, saldo = 0) {
  const totalRedondo = Math.round(Number(total) || 0)
  const disponible = Math.max(0, Math.round(Number(saldo) || 0))
  const usado = pago?.usarSaldo && pago.modo !== 'no' ? Math.min(disponible, totalRedondo) : 0
  return { usado, aPagar: totalRedondo - usado, total: totalRedondo, disponible }
}

// Lo que se envía al backend junto con la renovación. total = precio de las cuentas renovadas.
export function pagoParaEnviar(pago, detalle = [], total = 0, saldo = 0) {
  if (!pago || pago.modo === 'no') return { registrar: false }
  const { usado, aPagar } = calcularSaldo(pago, total, saldo)
  const conSaldo = usado > 0 ? { usar_saldo: usado } : {}
  if (usado > 0 && aPagar === 0) {
    return { registrar: true, estado: 'saldo', ...conSaldo, detalle }
  }
  if (pago.modo === 'pendiente') {
    return { registrar: true, estado: 'pendiente', monto: aPagar, medio: null, detalle, ...conSaldo }
  }
  if (pago.modo === 'parcial') {
    return {
      registrar: true,
      estado: 'parcial',
      monto: Number(pago.monto) || 0,
      total: aPagar,
      medio: pago.medio || null,
      detalle,
      ...conSaldo,
    }
  }
  return { registrar: true, estado: 'pagado', monto: Number(pago.monto) || 0, medio: pago.medio || null, detalle, ...conSaldo }
}

export function errorPago(pago, total = 0, saldo = 0) {
  if (!pago || pago.modo === 'no') return ''
  const { usado, aPagar: totalRedondo } = calcularSaldo(pago, total, saldo)
  if (usado > 0 && totalRedondo === 0) return ''
  if (pago.modo === 'pendiente') {
    return totalRedondo > 0 ? '' : 'Estas cuentas no tienen precio, así que no hay valor para fiar. Ponles precio o usa "No registrar".'
  }
  const monto = Number(pago.monto)
  if (pago.monto === '' || pago.monto === null || Number.isNaN(monto)) {
    return pago.modo === 'parcial'
      ? 'Escribe cuánto pagó ahora.'
      : 'Escribe el monto del pago (o marca "No registrar").'
  }
  if (monto < 0) return 'El monto no puede ser negativo.'
  if (pago.modo === 'parcial') {
    if (monto <= 0) return 'Si no pagó nada, usa "Fiado".'
    if (monto >= totalRedondo) return 'Si pagó el total o más, usa "Pagó".'
  }
  return ''
}
