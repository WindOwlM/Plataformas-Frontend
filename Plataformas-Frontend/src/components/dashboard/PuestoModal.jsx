import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import AutocompleteField from '../ui/AutocompleteField'
import InputField from '../ui/InputField'
import Button from '../ui/Button'

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
      // Cargar datos del puesto si existe
      if (puesto) {
        setIdUsuario(puesto.id_usuario || '')
        setPin(puesto.pin || '')
        setVencimiento(puesto.vencimiento_usuario || '')
        setValorVenta(puesto.valor_venta || '')
        setEsCombo(puesto.es_combo || false)
      } else {
        // Nuevo puesto
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
    setIsLoading(true)

    const puestoData = {
      id_cuenta: cuenta?.id,
      id_usuario: idUsuario || null,
      pin: pin || null,
      vencimiento_usuario: vencimiento || null,
      es_combo: esCombo,
      valor_venta: parseFloat(valorVenta) || 0
    }

    // Si es edición, incluir el ID del puesto
    if (puesto?.id) {
      puestoData.id = puesto.id
    }

    await onSubmit(puestoData)
    setIsLoading(false)
    onClose()
  }

  if (!isOpen) return null

  const esEdicion = !!puesto?.id
  const titulo = esEdicion ? 'Editar Puesto' : 'Nuevo Puesto'
  const subtitulo = cuenta?.correo || ''

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-xl">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-white">{titulo}</h3>
          {subtitulo && (
            <p className="text-sm text-gray-400 mt-1">{subtitulo}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cliente */}
          <AutocompleteField
            id="cliente"
            label="Cliente"
            placeholder="Buscar cliente..."
            value={idUsuario}
            onChange={setIdUsuario}
            options={clientes}
            getOptionLabel={(opt) => opt.nombre}
            getOptionValue={(opt) => opt.id}
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
                className="block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {esEdicion ? 'Guardar Cambios' : 'Crear Puesto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}