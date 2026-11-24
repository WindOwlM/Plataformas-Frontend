export function formatFecha(key) {
  if (!key) return 'Sin fecha'
  const [y, m, d] = String(key).slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return 'Sin fecha'
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function parseFechaLocal(key) {
  const s = String(key || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return new Date(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)))
}

export function fechaHoy() {
  const dt = new Date()
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function sumarDias(key, days) {
  const dt = parseFechaLocal(key) || parseFechaLocal(fechaHoy())
  dt.setDate(dt.getDate() + Number(days) || 0)
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const bucketMeta = {
  manana: {
    title: 'Vence mañana',
    badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  hoy: {
    title: 'Vence hoy',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  },
  vencida: {
    title: 'Ya vencida',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
}

export function formatSaldo(valor) {
  const n = Number(valor)
  if (!Number.isFinite(n)) return '$0'
  return `$${Math.round(n).toLocaleString('es-CO')}`
}

export function mensajeRecordatorioHoy(item) {
  const cuentas = []
  const vistos = new Set()

  function agregar(plataforma, correo, valor, id) {
    const plat = String(plataforma || '').trim()
    const mail = String(correo || '').trim()
    if (!plat || !mail) return
    const clave = id || `${plat.toLowerCase()}|${mail.toLowerCase()}`
    if (vistos.has(clave)) return
    vistos.add(clave)
    cuentas.push({ plat, mail, valor: Number(valor) || 0 })
  }

  const filas = item?.tipo === 'combo'
    ? (item.asignaciones?.length ? item.asignaciones : item.renovaciones || [])
    : []

  if (filas.length > 0) {
    for (const fila of filas) {
      agregar(
        fila.plataforma,
        fila.correo || (fila.por_ubicar ? 'Por ubicar' : ''),
        fila.valor ?? fila.valor_venta,
        fila.id_puesto || fila.id_por_ubicar
      )
    }
  } else if (item?.tipo === 'por_ubicar') {
    const plat = String(item?.plataforma || '').trim()
    const mail = String(item?.correo || '').trim()
    if (plat) {
      cuentas.push({ plat, mail: mail || 'Por ubicar', valor: Number(item?.valor) || 0 })
    }
  } else {
    agregar(item?.plataforma, item?.correo || item?.nombre, item?.valor)
  }

  const bloqueCuentas = cuentas.map((c) => `${c.plat}:\n${c.mail}`).join('\n')
  const saldo = cuentas.reduce((suma, c) => suma + c.valor, 0)

  return `Estimado cliente
Te recordamos que hoy se cumplen los 30 días de tu suscripción, no olvides renovarla para seguir disfrutando de tus series y películas favoritas.

${bloqueCuentas}

Saldo: ${formatSaldo(saldo)}

Nuestros medios de pago habilitados son: Llave, Bancolombia, Nequi y Daviplata.`
}

export function puestoCortado(puesto) {
  return String(puesto?.estado || '').toLowerCase() === 'cortado'
}

export function puestoPorCortar(puesto) {
  if (puestoCortado(puesto)) return false
  const bucket = classifyFecha(puesto?.vencimiento_usuario)
  return bucket === 'vencida' || bucket === 'hoy'
}

export function resumenCorte(puestos = []) {
  let porCortar = 0
  let cortados = 0
  for (const puesto of puestos) {
    if (puestoCortado(puesto)) cortados += 1
    else if (puestoPorCortar(puesto)) porCortar += 1
  }
  return { porCortar, cortados }
}

export function classifyFecha(fecha) {
  const key = String(fecha || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null
  const today = fechaHoy()
  const manana = sumarDias(today, 1)
  if (key === manana) return 'manana'
  if (key === today) return 'hoy'
  if (key < today) return 'vencida'
  return null
}

// "2026-12-22" -> "22 de diciembre"
export function fechaCorteTexto(key) {
  const dt = parseFechaLocal(key)
  if (!dt) return ''
  const mes = dt.toLocaleDateString('es-CO', { month: 'long' })
  return `${dt.getDate()} de ${mes}`
}

// Mensaje con los datos de la cuenta que se le envía al cliente
export function mensajeDatosCuenta(cuenta, puesto) {
  const plataforma = String(cuenta?.plataforma?.nombre_plat || 'Cuenta').trim().toUpperCase()
  const corte = fechaCorteTexto(puesto?.vencimiento_usuario)
  const lineas = [
    `${plataforma} 🎬`,
    cuenta?.correo || '',
    `Contraseña: ${cuenta?.contrasena || ''}`,
  ]
  if (puesto?.pin) lineas.push(`Pin: ${puesto.pin}`)
  if (corte) lineas.push(`Corte: ${corte}`)
  lineas.push(
    '⚠️ Esta es una cuenta de uso compartido, por ende, al adquirir tu pantalla aceptas las políticas para el uso de la misma 👇. ',
    '🚫 Usar los datos y reproducción en 2 dispositivos, cambio de contraseña y/o modificación de nombre o PIN de la pantalla genera expulsión definitiva de la cuenta sin devolución de dinero.',
    'NOTA: Para reporte de novedades, debe enviar foto de la falla y datos de la cuenta para la respectiva revisión',
  )
  return lineas.join('\n')
}

// Mensaje con las cuentas de un proveedor (para nosotros, sin saludo):
// agrupa los correos por plataforma.
export function mensajeCuentasProveedor(cuentas) {
  const porPlataforma = new Map()
  for (const c of cuentas || []) {
    const plat = String(c.plataforma || 'Sin plataforma').trim()
    const correo = String(c.correo || c.nombre || '').trim()
    if (!correo) continue
    if (!porPlataforma.has(plat)) porPlataforma.set(plat, [])
    porPlataforma.get(plat).push(correo)
  }
  return [...porPlataforma.entries()]
    .map(([plat, correos]) => `${plat}:\n${correos.join('\n')}`)
    .join('\n\n')
}
