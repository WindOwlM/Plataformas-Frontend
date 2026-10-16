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
