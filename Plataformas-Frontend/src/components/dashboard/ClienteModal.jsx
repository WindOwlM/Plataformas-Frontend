import { useState, useEffect } from 'react'
import InputField from '../ui/InputField'
import Button from '../ui/Button'

export default function ClienteModal({ isOpen, onClose, onSubmit, cliente = null }) {
  const [nombre, setNombre] = useState('')
  const [numeroTelefono, setNumeroTelefono] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Si hay cliente (modo edición), cargar datos
  useEffect(() => {
    if (cliente) {
      setNombre(cliente.nombre || '')
      setNumeroTelefono(cliente.numero_telefono || '')
    } else {
      setNombre('')
      setNumeroTelefono('')
    }
  }, [cliente, isOpen])

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    setIsLoading(true)
    await onSubmit({
      nombre: nombre.trim(),
      numero_telefono: numeroTelefono.trim() || null
    })
    setIsLoading(false)
    setNombre('')
    setNumeroTelefono('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">
          {cliente ? 'Editar Cliente' : 'Nuevo Cliente'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            id="nombre"
            label="Nombre completo *"
            placeholder="Ej: Juan Pérez"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <InputField
            id="telefono"
            label="Número de teléfono"
            placeholder="Ej: +57 300 123 4567"
            value={numeroTelefono}
            onChange={(e) => setNumeroTelefono(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {cliente ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}