import { useCallback, useEffect, useState } from 'react'

// Lo que cada cliente debe (fiados pendientes), por id de cliente.
export function useDeudas(request) {
  const [deudas, setDeudas] = useState(() => new Map())

  const recargar = useCallback(async () => {
    const { data } = await request('/pagos/pendientes', { silent: true })
    const mapa = new Map()
    for (const p of data?.pendientes || []) {
      if (p.tipo !== 'cobro' || !p.id_usuario) continue
      const actual = mapa.get(p.id_usuario) || { total: 0, cantidad: 0, desde: p.fecha }
      actual.total += Number(p.monto) || 0
      actual.cantidad += 1
      if (p.fecha < actual.desde) actual.desde = p.fecha
      mapa.set(p.id_usuario, actual)
    }
    setDeudas(mapa)
  }, [request])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { deudas, recargarDeudas: recargar }
}
