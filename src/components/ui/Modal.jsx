import { createPortal } from 'react-dom'

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-md',
}) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div
        className={`relative z-10 bg-gray-800 rounded-t-2xl sm:rounded-2xl border border-gray-700 shadow-xl w-full ${maxWidth} max-h-[92dvh] sm:max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || subtitle) && (
          <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-3 shrink-0">
            {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-400 mt-1 break-all">{subtitle}</p>}
          </div>
        )}
        <div className="px-4 sm:px-6 pb-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
