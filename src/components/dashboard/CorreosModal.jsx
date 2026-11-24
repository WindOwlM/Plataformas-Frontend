import { useEffect, useState } from 'react'
import { useApi } from '../../hooks/useApi'
import Modal from '../ui/Modal'
import VisorCorreos, { BotonesConectar, buzonDe } from '../correos/VisorCorreos'

export default function CorreosModal({ isOpen, onClose, correo, vinculado, onCambio }) {
  const { request } = useApi()
  const [mostrarConectar, setMostrarConectar] = useState(false)

  useEffect(() => {
    if (isOpen) setMostrarConectar(!vinculado)
  }, [isOpen, vinculado])

  const ruta = `${window.location.pathname}?correo=${encodeURIComponent(correo || '')}`
  // Para conectar se usa el buzón real (sin el +)
  const buzon = buzonDe(correo)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Correos" subtitle={correo} maxWidth="max-w-3xl">
      {mostrarConectar ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            {vinculado
              ? 'Vuelve a conectar este correo para seguir viendo sus mensajes.'
              : `Este correo aún no está conectado. Conéctalo una sola vez: se abrirá la página de Microsoft o Google, entras con ${buzon} y das permiso de solo lectura.`}
          </p>
          <BotonesConectar request={request} correo={buzon} ruta={ruta} />
          {vinculado ? (
            <button type="button" onClick={() => setMostrarConectar(false)} className="text-xs text-gray-400 hover:text-white">
              Volver a los correos
            </button>
          ) : null}
        </div>
      ) : isOpen && correo ? (
        <VisorCorreos
          request={request}
          correo={correo}
          onReconectar={() => setMostrarConectar(true)}
          onDesconectado={() => {
            onCambio?.()
            setMostrarConectar(true)
          }}
        />
      ) : null}
    </Modal>
  )
}
