import { puestosDe } from './cuentaEstado'

export function clavePlataforma(nombre) {
  const n = String(nombre || 'Sin plataforma').toLowerCase()
  if (n.includes('netflix')) return `0-${n}`
  return `1-${n}`
}

function find(parent, id) {
  if (parent[id] !== id) parent[id] = find(parent, parent[id])
  return parent[id]
}

function ordenarPorCombo(cuentas) {
  const parent = {}
  for (const cuenta of cuentas) parent[cuenta.id] = cuenta.id

  const porUsuario = new Map()
  for (const cuenta of cuentas) {
    for (const puesto of puestosDe(cuenta)) {
      if (!puesto.id_usuario) continue
      if (String(puesto.estado || '').toLowerCase() === 'cortado') continue
      const ids = porUsuario.get(puesto.id_usuario) || []
      ids.push(cuenta.id)
      porUsuario.set(puesto.id_usuario, ids)
    }
  }

  for (const ids of porUsuario.values()) {
    const unicos = [...new Set(ids)]
    for (let i = 1; i < unicos.length; i += 1) {
      parent[find(parent, unicos[0])] = find(parent, unicos[i])
    }
  }

  const grupos = new Map()
  for (const cuenta of cuentas) {
    const raiz = find(parent, cuenta.id)
    const lista = grupos.get(raiz) || []
    lista.push(cuenta)
    grupos.set(raiz, lista)
  }

  return [...grupos.values()]
    .sort((a, b) => b.length - a.length || (a[0].correo || '').localeCompare(b[0].correo || ''))
    .flatMap((grupo) => grupo.sort((a, b) => (a.correo || '').localeCompare(b.correo || '')))
}

export function seccionesPorPlataforma(cuentas) {
  const map = new Map()

  for (const cuenta of cuentas) {
    const nombre = cuenta.plataforma?.nombre_plat || 'Sin plataforma'
    const id = cuenta.id_plataforma || nombre
    if (!map.has(id)) map.set(id, { id, nombre, cuentas: [] })
    map.get(id).cuentas.push(cuenta)
  }

  return [...map.values()]
    .sort((a, b) => clavePlataforma(a.nombre).localeCompare(clavePlataforma(b.nombre), 'es'))
    .map((seccion) => ({
      ...seccion,
      cuentas: ordenarPorCombo(seccion.cuentas),
    }))
}

export function esComboPuesto(puesto, cuentas, clienteId) {
  if (puesto.es_combo) return true
  if (!puesto.id_usuario) return false
  const id = clienteId || puesto.id_usuario
  let veces = 0
  for (const cuenta of cuentas) {
    if (puestosDe(cuenta).some((p) => p.id_usuario === id && String(p.estado || '').toLowerCase() !== 'cortado')) veces += 1
    if (veces > 1) return true
  }
  return false
}
