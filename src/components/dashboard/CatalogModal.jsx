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
}) {
  const [nombre, setNombre] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (item) {
      setNombre(item[nameKey] || '')
    } else {
      setNombre('')
    }
  }, [item, isOpen, nameKey])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) return

    setIsLoading(true)
    await onSubmit({ [nameKey]: nombre.trim() })
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
