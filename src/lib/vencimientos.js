function dateKey(value) {
  if (!value) return null
  const s = String(value).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  return s
}

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftKey(key, days) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function formatFecha(key) {
  if (!key) return 'Sin fecha'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function classifyVencimiento(fecha) {
  const key = dateKey(fecha)
  if (!key) return null
  const today = todayKey()
  const tomorrow = shiftKey(today, 1)
  if (key === tomorrow) return 'manana'
  if (key === today) return 'hoy'
  if (key < today) return 'vencida'
  return null
}

export function buildVencimientoItems(cuentas = []) {
  const items = []

  for (const cuenta of cuentas) {
    const puestos = cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []
    const plataforma = cuenta.plataforma?.nombre_plat || '—'
    const proveedor = cuenta.proveedor?.nombre_prov || '—'

    for (const puesto of puestos) {
      const bucket = classifyVencimiento(puesto.vencimiento_usuario)
      if (!bucket) continue
      items.push({
        id: `puesto-${puesto.id || `${cuenta.id}-${puesto.id_usuario}`}`,
        tipo: 'usuario',
        bucket,
        fecha: dateKey(puesto.vencimiento_usuario),
        nombre: puesto.usuario?.nombre || 'Cliente sin nombre',
        telefono: puesto.usuario?.numero_telefono || '',
        correo: cuenta.correo,
        plataforma,
        proveedor,
        pin: puesto.pin || '',
        valor: puesto.valor_venta,
      })
    }

    const cuentaBucket = classifyVencimiento(cuenta.fecha_vencimiento)
    if (cuentaBucket) {
      items.push({
        id: `cuenta-${cuenta.id}`,
        tipo: 'cuenta',
        bucket: cuentaBucket,
        fecha: dateKey(cuenta.fecha_vencimiento),
        nombre: cuenta.correo,
        telefono: '',
        correo: cuenta.correo,
        plataforma,
        proveedor,
        pin: '',
        valor: cuenta.precio_costo,
      })
    }
  }

  const order = { hoy: 0, manana: 1, vencida: 2 }
  return items.sort((a, b) => {
    if (order[a.bucket] !== order[b.bucket]) return order[a.bucket] - order[b.bucket]
    return (a.fecha || '').localeCompare(b.fecha || '')
  })
}

export { formatFecha, todayKey }
