import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import InputField from '../ui/InputField'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'

export default function EditarPorUbicarModal({ isOpen, onClose, onSubmit, pendiente }) {
  const { request } = useApi()
  const [plataformas, setPlataformas] = useState([])
  const [idPlataforma, setIdPlataforma] = useState('')
  const [pin, setPin] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [valorVenta, setValorVenta] = useState('')
  const [esCombo, setEsCombo] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !pendiente?.id) return
    setIdPlataforma(pendiente.id_plataforma || '')
    setPin(pendiente.pin || '')
    setVencimiento(String(pendiente.vencimiento_usuario || '').slice(0, 10))
    setValorVenta(pendiente.valor_venta ?? '')
    setEsCombo(!!pendiente.es_combo)
    request('/catalogos/plataformas', { silent: true }).then(({ data }) => {
      if (data) setPlataformas(data)
    })
  }, [isOpen, pendiente, request])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    const ok = await onSubmit({
      id_plataforma: idPlataforma || pendiente.id_plataforma,
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
      title="Editar por ubicar"
      subtitle={pendiente?.usuario?.nombre || ''}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-gray-400">
          Última cuenta: {pendiente?.cuenta?.correo || pendiente?.cuenta_anterior?.correo || '—'}
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma</label>
          <select
            value={idPlataforma}
            onChange={(e) => setIdPlataforma(e.target.value)}
            className={fieldClass}
          >
            <option value="">Selecciona plataforma</option>
            {plataformas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre_plat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            id="pin-editar-ubicar"
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
          id="venta-editar-ubicar"
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

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  )
}
