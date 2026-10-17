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

export function mensajeRecordatorioHoy(item) {
  const cuentas = []
  const vistos = new Set()

  function agregar(plataforma, correo) {
    const plat = String(plataforma || '').trim()
    const mail = String(correo || '').trim()
    if (!plat || !mail) return
    const clave = `${plat.toLowerCase()}|${mail.toLowerCase()}`
    if (vistos.has(clave)) return
    vistos.add(clave)
    cuentas.push(`${plat}:\n${mail}`)
  }

  const filas = item?.tipo === 'combo'
    ? (item.asignaciones?.length ? item.asignaciones : item.renovaciones || [])
    : []

  if (filas.length > 0) {
    for (const fila of filas) agregar(fila.plataforma, fila.correo)
  } else {
    agregar(item?.plataforma, item?.correo || item?.nombre)
  }

  const bloqueCuentas = cuentas.join('\n')

  return `Estimado cliente
Te recordamos que hoy se cumplen los 30 días de tu suscripción, no olvides renovarla para seguir disfrutando de tus series y películas favoritas.

${bloqueCuentas}

Nuestros medios de pago habilitados son: Llave, Bancolombia, Nequi y Daviplata.`
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
