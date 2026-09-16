import { useState } from 'react'
import InputField from '../ui/InputField'
import Button from '../ui/Button'

export default function AddModal({ isOpen, onClose, onSubmit, title, placeholder }) {
  const [nombre, setNombre] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    setIsLoading(true)
    await onSubmit(nombre.trim())
    setIsLoading(false)
    setNombre('')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            id="nombre"
            label="Nombre"
            placeholder={placeholder}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}