import { TriangleAlert } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  variant = 'danger',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-red-500/20' : 'bg-yellow-500/20'
        }`}>
          <TriangleAlert className={`h-5 w-5 ${variant === 'danger' ? 'text-red-400' : 'text-yellow-400'}`} />
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <p className="text-gray-400 mb-6">{message}</p>
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="button" variant={variant} onClick={onConfirm} className="flex-1">
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
