import { TriangleAlert } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function QuitarClienteModal({ isOpen, onClose, onEliminar, onUbicar, nombre, correo }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quitar de la cuenta">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-yellow-500/20 shrink-0">
          <TriangleAlert className="h-5 w-5 text-yellow-400" />
        </div>
        <p className="text-gray-400 text-sm">
          ¿Qué quieres hacer con <span className="text-white font-medium">{nombre || 'este cliente'}</span>
          {correo ? ` en ${correo}` : ''}?
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button type="button" onClick={onUbicar} className="w-full">
          Pasar a por ubicar
        </Button>
        <Button type="button" variant="danger" onClick={onEliminar} className="w-full">
          Eliminar de la cuenta
        </Button>
        <Button type="button" variant="secondary" onClick={onClose} className="w-full">
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}
