import { useCallback, useEffect, useState } from 'react'

// Lo que cada cliente debe (fiados pendientes) y su saldo a favor, por id de cliente.
//   { total: debe, cantidad: nº de fiados, desde: fecha del fiado más viejo, saldo }
export function useDeudas(request) {
  const [deudas, setDeudas] = useState(() => new Map())

  const recargar = useCallback(async () => {
    const { data } = await request('/pagos/clientes-estado', { silent: true })
    const mapa = new Map()
    for (const [id, c] of Object.entries(data?.clientes || {})) {
      mapa.set(id, { total: c.debe, cantidad: c.fiados, desde: c.desde, saldo: c.saldo })
    }
    setDeudas(mapa)
  }, [request])

  useEffect(() => {
    recargar()
  }, [recargar])

  return { deudas, recargarDeudas: recargar }
}
