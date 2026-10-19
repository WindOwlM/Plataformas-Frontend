import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'
import { cuentaLlena, etiquetaEstado } from '../../lib/cuentaEstado'

export default function QuitarClienteModal({
  isOpen,
  onClose,
  onEliminar,
  onUbicar,
  onReubicar,
  nombre,
  correo,
  cuentaId,
  plataformaId,
}) {
  const { request } = useApi()
  const [paso, setPaso] = useState('menu')
  const [cuentas, setCuentas] = useState([])
  const [idDestino, setIdDestino] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setPaso('menu')
    setIdDestino('')
    setError('')
    setCuentas([])
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || paso !== 'reubicar' || !plataformaId) return
    request(`/cuentas?plataforma=${plataformaId}`, { silent: true }).then(({ data }) => {
      setCuentas((data || []).filter((c) => c.id !== cuentaId))
    })
  }, [isOpen, paso, plataformaId, cuentaId, request])

  async function confirmarReubicar() {
    if (!idDestino) return
    setGuardando(true)
    setError('')
    const ok = await onReubicar(idDestino)
    setGuardando(false)
    if (ok === false) {
      setError('No se pudo reubicar. Revisa que la cuenta tenga cupo.')
      return
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paso === 'reubicar' ? 'Reubicar cliente' : 'Quitar de la cuenta'}
    >
      {paso === 'reubicar' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Mueve a <span className="text-white font-medium">{nombre || 'este cliente'}</span>
            {correo ? ` desde ${correo}` : ''} a otra cuenta de la misma plataforma. Se mantiene PIN, fecha y precio.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Cuenta destino *</label>
            <select
              value={idDestino}
              onChange={(e) => setIdDestino(e.target.value)}
              className={fieldClass}
            >
              <option value="">Selecciona una cuenta con cupo</option>
              {cuentas.map((c) => {
                const llena = cuentaLlena(c)
                return (
                  <option key={c.id} value={c.id} disabled={llena}>
                    {c.correo} · {etiquetaEstado(c.estado)} · {c.ocupados ?? 0}/{c.max_puestos ?? 5}
                    {llena ? ' (llena)' : ''}
                  </option>
                )
              })}
            </select>
          </div>
          {cuentas.length === 0 ? (
            <p className="text-xs text-gray-500">No hay otras cuentas de esta plataforma.</p>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setPaso('menu')} className="flex-1">
              Atrás
            </Button>
            <Button type="button" onClick={confirmarReubicar} isLoading={guardando} disabled={!idDestino} className="flex-1">
              Reubicar
            </Button>
          </div>
        </div>
      ) : (
        <>
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
            <Button type="button" onClick={() => setPaso('reubicar')} className="w-full">
              Reubicar a otra cuenta
            </Button>
            <Button type="button" variant="secondary" onClick={onUbicar} className="w-full">
              Pasar a por ubicar
            </Button>
            <Button type="button" variant="danger" onClick={onEliminar} className="w-full">
              Dejar recordatorio para borrar del perfil
            </Button>
            <p className="text-[11px] text-gray-500 px-1">
              El cliente sigue visible en esta cuenta hasta que lo quites del perfil y pulses “Borrar de esta cuenta”.
            </p>
            <Button type="button" variant="secondary" onClick={onClose} className="w-full">
              Cancelar
            </Button>
          </div>
        </>
      )}
    </Modal>
  )
}
