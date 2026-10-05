import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import AutocompleteField from '../ui/AutocompleteField'
import InputField from '../ui/InputField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'

export default function PuestoModal({ isOpen, onClose, onSubmit, cuenta, puesto }) {
  const [idUsuario, setIdUsuario] = useState('')
  const [pin, setPin] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [valorVenta, setValorVenta] = useState('')
  const [esCombo, setEsCombo] = useState(false)
  const [clientes, setClientes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { request } = useApi()

  useEffect(() => {
    if (isOpen) {
      cargarClientes()
      if (puesto) {
        setIdUsuario(puesto.id_usuario || '')
        setPin(puesto.pin || '')
        setVencimiento(puesto.vencimiento_usuario || '')
        setValorVenta(puesto.valor_venta || '')
        setEsCombo(puesto.es_combo || false)
      } else {
        setIdUsuario('')
        setPin('')
        setVencimiento('')
        setValorVenta('')
        setEsCombo(false)
      }
    }
  }, [isOpen, puesto])

  async function cargarClientes() {
    const { data } = await request('/clientes')
    if (data) setClientes(data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!idUsuario) return

    setIsLoading(true)

    const puestoData = {
      id_cuenta: cuenta?.id,
      id_usuario: idUsuario,
      pin: pin || null,
      vencimiento_usuario: vencimiento || null,
      es_combo: esCombo,
      valor_venta: parseFloat(valorVenta) || 0,
    }

    if (puesto?.id) {
      puestoData.id = puesto.id
    }

    const result = await onSubmit(puestoData)
    setIsLoading(false)
    if (result !== false) onClose()
  }

  const esEdicion = !!puesto?.id

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar asignación' : 'Asignar cliente'}
      subtitle={cuenta?.correo ? `Cuenta: ${cuenta.correo}` : ''}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AutocompleteField
          id="cliente"
          label="Cliente *"
          placeholder="Buscar cliente ya creado..."
          value={idUsuario}
          onChange={setIdUsuario}
          options={clientes}
          getOptionLabel={(opt) =>
            opt.numero_telefono ? `${opt.nombre} · ${opt.numero_telefono}` : opt.nombre
          }
          getOptionValue={(opt) => opt.id}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <InputField
            id="pin"
            label="PIN / Clave"
            placeholder="PIN del perfil"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vencimiento</label>
            <input
              type="date"
              value={vencimiento}
              onChange={(e) => setVencimiento(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <InputField
          id="valor"
          label="Precio de venta"
          type="number"
          placeholder="0.00"
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
          <span className="text-sm text-gray-400">Es combo (múltiples servicios)</span>
        </label>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {esEdicion ? 'Guardar cambios' : 'Asignar a la cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
