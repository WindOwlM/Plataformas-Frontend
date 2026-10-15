import { useEffect, useMemo, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import InputField from '../ui/InputField'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'
import { cuentaLlena, etiquetaEstado } from '../../lib/cuentaEstado'

export default function ReubicarModal({ isOpen, onClose, onSubmit, pendiente }) {
  const { request } = useApi()
  const [plataformas, setPlataformas] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [idPlataforma, setIdPlataforma] = useState('')
  const [idCuenta, setIdCuenta] = useState('')
  const [pin, setPin] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [valorVenta, setValorVenta] = useState('')
  const [esCombo, setEsCombo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !pendiente?.id) return

    setIdPlataforma(pendiente.id_plataforma || '')
    setIdCuenta('')
    setPin(pendiente.pin || '')
    setVencimiento(pendiente.vencimiento_usuario || '')
    setValorVenta(pendiente.valor_venta ?? '')
    setEsCombo(!!pendiente.es_combo)

    request(`/por-ubicar/${pendiente.id}/opciones`).then(({ data }) => {
      setPlataformas(data?.plataformas || [])
      setCuentas(data?.cuentas || [])
    })
  }, [isOpen, pendiente, request])

  const cuentasFiltradas = useMemo(
    () => (idPlataforma ? cuentas.filter((c) => c.id_plataforma === idPlataforma) : []),
    [cuentas, idPlataforma]
  )

  async function handleSubmit(e) {
    e.preventDefault()
    if (!idCuenta) return
    setIsLoading(true)
    const ok = await onSubmit({
      id_cuenta: idCuenta,
      pin: pin || null,
      vencimiento_usuario: vencimiento || null,
      es_combo: esCombo,
      valor_venta: parseFloat(valorVenta) || 0,
    })
    setIsLoading(false)
    if (ok !== false) onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reubicar cliente"
      subtitle={pendiente?.usuario?.nombre || ''}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-400">
          Última cuenta: {pendiente?.cuenta?.correo || pendiente?.cuenta_anterior?.correo || '—'}
          {' · '}
          Plataforma: {pendiente?.plataforma?.nombre_plat || '—'}
        </p>
        <p className="text-xs text-gray-500">
          Solo puedes elegir plataformas en las que esta persona ya estuvo.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma *</label>
          <select
            value={idPlataforma}
            onChange={(e) => {
              setIdPlataforma(e.target.value)
              setIdCuenta('')
            }}
            className={fieldClass}
            required
          >
            <option value="">Selecciona plataforma</option>
            {plataformas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre_plat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Cuenta destino *</label>
          <select
            value={idCuenta}
            onChange={(e) => setIdCuenta(e.target.value)}
            className={fieldClass}
            required
            disabled={!idPlataforma}
          >
            <option value="">Selecciona cuenta</option>
            {cuentasFiltradas.map((c) => (
              <option key={c.id} value={c.id} disabled={cuentaLlena(c)}>
                {c.correo} ({etiquetaEstado(c.estado)} · {c.ocupados ?? 0}/{c.max_puestos ?? 5})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputField
            id="pin-reubicar"
            label="PIN / Clave"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vencimiento</label>
            <input
              type="date"
              value={vencimiento || ''}
              onChange={(e) => setVencimiento(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <InputField
          id="venta-reubicar"
          label="Precio de venta"
          type="number"
          value={valorVenta}
          onChange={(e) => setValorVenta(e.target.value)}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={esCombo}
            onChange={(e) => setEsCombo(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-400">Es combo</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Reubicar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
