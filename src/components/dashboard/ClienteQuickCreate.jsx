import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import InputField from '../ui/InputField'
import Button from '../ui/Button'

export default function ClienteQuickCreate({ onCreated }) {
  const { request } = useApi()
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function crear() {
    if (!nombre.trim()) return
    setIsLoading(true)
    setError('')
    const { data, error: err } = await request('/clientes', {
      method: 'POST',
      body: JSON.stringify({
        nombre: nombre.trim(),
        numero_telefono: telefono.trim() || null,
      }),
    })
    setIsLoading(false)
    if (err) {
      setError(err)
      return
    }
    const cliente = data?.cliente || data
    if (cliente?.id) onCreated(cliente)
    setNombre('')
    setTelefono('')
    setAbierto(false)
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1.5"
      >
        <Plus className="h-3.5 w-3.5" />
        Crear cliente
      </button>
    )
  }

  return (
    <div
      className="mt-2 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-3 space-y-3"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
          crear()
        }
      }}
    >
      <p className="text-xs font-medium text-indigo-300">Nuevo cliente</p>
      <InputField
        id="nuevo-cliente-nombre"
        label="Nombre *"
        placeholder="Ej: Juan Pérez"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <InputField
        id="nuevo-cliente-telefono"
        label="Teléfono"
        placeholder="Ej: 300 123 4567"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
      />
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setAbierto(false)} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={crear} isLoading={isLoading} className="flex-1">
          Crear
        </Button>
      </div>
    </div>
  )
}
