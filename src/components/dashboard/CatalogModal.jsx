import { useState, useEffect } from 'react'
import InputField from '../ui/InputField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function CatalogModal({
  isOpen,
  onClose,
  onSubmit,
  item = null,
  titleNew,
  titleEdit,
  label,
  placeholder,
  nameKey,
  withMaxPuestos = false,
}) {
  const [nombre, setNombre] = useState('')
  const [maxPuestos, setMaxPuestos] = useState(5)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setNombre(item[nameKey] || '')
      setMaxPuestos(item.max_puestos || 5)
    } else {
      setNombre('')
      setMaxPuestos(5)
    }
  }, [item, isOpen, nameKey])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    setIsLoading(true)
    const payload = { [nameKey]: nombre.trim() }
    if (withMaxPuestos) payload.max_puestos = Number(maxPuestos) || 5
    await onSubmit(payload)
    setIsLoading(false)
    setNombre('')
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? titleEdit : titleNew}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          id={nameKey}
          label={`${label} *`}
          placeholder={placeholder}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        {withMaxPuestos && (
          <InputField
            id="max_puestos"
            label="Máximo de puestos"
            type="number"
            min="1"
            value={maxPuestos}
            onChange={(e) => setMaxPuestos(e.target.value)}
          />
        )}
        <div className="flex gap-3 pt-2">
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
