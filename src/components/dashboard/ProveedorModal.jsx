import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import InputField from '../ui/InputField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'

function celularesDe(item) {
  if (Array.isArray(item?.celulares)) return item.celulares.filter(Boolean)
  if (typeof item?.celulares === 'string' && item.celulares.trim()) {
    return item.celulares.split(/[\n,;|]/).map((n) => n.trim()).filter(Boolean)
  }
  if (item?.celular) return [String(item.celular)]
  return ['']
}

export default function ProveedorModal({ isOpen, onClose, onSubmit, item }) {
  const [nombre, setNombre] = useState('')
  const [celulares, setCelulares] = useState([''])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setNombre(item?.nombre_prov || '')
    const nums = celularesDe(item)
    setCelulares(nums.length ? nums : [''])
  }, [isOpen, item])

  function actualizarCelular(index, value) {
    setCelulares((prev) => prev.map((n, i) => (i === index ? value : n)))
  }

  function agregarCelular() {
    setCelulares((prev) => [...prev, ''])
  }

  function quitarCelular(index) {
    setCelulares((prev) => (prev.length <= 1 ? [''] : prev.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setIsLoading(true)
    await onSubmit({
      nombre_prov: nombre.trim(),
      celulares: celulares.map((n) => n.trim()).filter(Boolean),
    })
    setIsLoading(false)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Editar proveedor' : 'Nuevo proveedor'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          id="nombre_prov"
          label="Nombre *"
          placeholder="Ej: Proveedor Juan, Cuentas Premium..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">Celulares</p>
          {celulares.map((numero, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="tel"
                value={numero}
                onChange={(e) => actualizarCelular(index, e.target.value)}
                placeholder="300 000 0000"
                className={fieldClass}
              />
              <button
                type="button"
                onClick={() => quitarCelular(index)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg shrink-0"
                title="Quitar número"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button type="button" size="sm" variant="secondary" onClick={agregarCelular}>
            <Plus className="h-3.5 w-3.5" />
            Agregar celular
          </Button>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {item ? 'Guardar cambios' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
