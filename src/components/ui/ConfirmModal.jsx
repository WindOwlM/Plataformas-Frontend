import Button from './Button'

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', variant = 'danger' }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-700 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            <svg className={`h-5 w-5 ${variant === 'danger' ? 'text-red-400' : 'text-yellow-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        
        <p className="text-gray-400 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant={variant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}