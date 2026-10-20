import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import AutocompleteField, { labelCliente, optionId } from '../ui/AutocompleteField'
import InputField from '../ui/InputField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'
import ClienteQuickCreate from './ClienteQuickCreate'
import { cuentaLlena, etiquetaOpcionCuenta, ordenarCuentasPorCupo } from '../../lib/cuentaEstado'

let extraSeq = 0
function extraKey() {
  extraSeq += 1
  return `combo-${Date.now()}-${extraSeq}`
}

export default function PuestoModal({
  isOpen,
  onClose,
  onSubmit,
  cuenta,
  puesto,
  clientesPrecargados,
  onClienteCreado,
}) {
  const [idUsuario, setIdUsuario] = useState('')
  const [pin, setPin] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [valorVenta, setValorVenta] = useState('')
  const [notas, setNotas] = useState('')
  const [esCombo, setEsCombo] = useState(false)
  const [extras, setExtras] = useState([])
  const [plataformas, setPlataformas] = useState([])
  const [cuentasPorPlat, setCuentasPorPlat] = useState({})
  const [clientes, setClientes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const { request } = useApi()
  const cuentasCargadas = useRef(new Set())

  const esEdicion = !!puesto?.id

  useEffect(() => {
    if (isOpen) {
      cargarClientes()
      request('/catalogos/plataformas', { silent: true }).then(({ data }) => {
        if (data) setPlataformas(data)
      })
      cuentasCargadas.current = new Set()
      setCuentasPorPlat({})
      if (puesto) {
        setIdUsuario(puesto.id_usuario || '')
        setPin(puesto.pin || '')
        setVencimiento(puesto.vencimiento_usuario || '')
        setValorVenta(puesto.valor_venta || '')
        setNotas(puesto.notas || '')
        setEsCombo(puesto.es_combo || false)
        setExtras([])
      } else {
        setIdUsuario('')
        setPin('')
        setVencimiento('')
        setValorVenta('')
        setNotas('')
        setEsCombo(false)
        setExtras([])
      }
    }
  }, [isOpen, puesto])

  async function cargarClientes() {
    if (clientesPrecargados?.length) {
      setClientes(clientesPrecargados)
      return
    }
    const { data } = await request('/clientes', { silent: true })
    if (data) setClientes(data)
  }

  const cargarCuentasPlat = useCallback(
    async (idPlataforma) => {
      if (!idPlataforma || cuentasCargadas.current.has(idPlataforma)) return
      cuentasCargadas.current.add(idPlataforma)
      const { data } = await request(`/cuentas?plataforma=${idPlataforma}`, { silent: true })
      setCuentasPorPlat((prev) => ({ ...prev, [idPlataforma]: data || [] }))
    },
    [request]
  )

  function actualizarExtra(key, patch) {
    setExtras((prev) => prev.map((linea) => (linea.key === key ? { ...linea, ...patch } : linea)))
  }

  function agregarExtra() {
    setExtras((prev) => [
      ...prev,
      {
        key: extraKey(),
        id_plataforma: '',
        id_cuenta: '',
        pin,
        vencimiento_usuario: vencimiento,
        valor_venta: valorVenta,
        notas,
      },
    ])
  }

  function quitarExtra(key) {
    setExtras((prev) => prev.filter((linea) => linea.key !== key))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!idUsuario) return

    setIsLoading(true)

    const extrasValidas = esCombo && !esEdicion
      ? extras.filter((linea) => linea.id_cuenta)
      : []
    const esComboFinal = esCombo || extrasValidas.length > 0

    const puestoData = {
      id_cuenta: cuenta?.id,
      id_usuario: idUsuario,
      pin: pin || null,
      vencimiento_usuario: vencimiento || null,
      es_combo: esComboFinal,
      valor_venta: parseFloat(valorVenta) || 0,
      notas: notas.trim() || null,
    }

    if (puesto?.id) {
      puestoData.id = puesto.id
    }

    const result = await onSubmit(
      puestoData,
      extrasValidas.map((linea) => ({
        id_cuenta: linea.id_cuenta,
        id_usuario: idUsuario,
        pin: linea.pin || pin || null,
        vencimiento_usuario: linea.vencimiento_usuario || vencimiento || null,
        es_combo: true,
        valor_venta: parseFloat(linea.valor_venta !== '' ? linea.valor_venta : valorVenta) || 0,
        notas: String(linea.notas != null && linea.notas !== '' ? linea.notas : notas || '').trim() || null,
      }))
    )
    setIsLoading(false)
    if (result !== false) onClose()
  }

  const plataformasExtra = plataformas.filter((p) => p.id !== cuenta?.id_plataforma)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar asignación' : 'Asignar cliente'}
      subtitle={cuenta?.correo ? `Cuenta: ${cuenta.correo}` : ''}
      maxWidth={esCombo && !esEdicion ? 'max-w-xl' : 'max-w-md'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <AutocompleteField
            id="cliente"
            label="Cliente *"
            placeholder="Buscar cliente o créalo abajo..."
            value={idUsuario}
            onChange={setIdUsuario}
            options={clientes}
            getOptionLabel={labelCliente}
            getOptionValue={optionId}
            required
          />
          <ClienteQuickCreate
            onCreated={(cliente) => {
              setClientes((prev) => [cliente, ...prev.filter((c) => c.id !== cliente.id)])
              setIdUsuario(cliente.id)
              onClienteCreado?.(cliente)
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InputField
            id="pin"
            label="PIN / Clave"
            placeholder="PIN del perfil"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Vencimiento</label>
            <input
              type="date"
              value={vencimiento}
              onChange={(e) => setVencimiento(e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <InputField
          id="valor"
          label="Precio de venta"
          type="number"
          placeholder="0.00"
          value={valorVenta}
          onChange={(e) => setValorVenta(e.target.value)}
        />

        <div>
          <label htmlFor="notas-puesto" className="block text-sm font-medium text-gray-300 mb-2">Notas</label>
          <textarea
            id="notas-puesto"
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones de este cliente en la cuenta"
            className={fieldClass}
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={esCombo}
            onChange={(e) => {
              const on = e.target.checked
              setEsCombo(on)
              if (!on) setExtras([])
            }}
            className="rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-400">Es combo (múltiples servicios)</span>
        </label>

        {esCombo && !esEdicion ? (
          <div className="space-y-3 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3">
            <p className="text-xs text-gray-400">
              Elige otras plataformas. Se copia PIN, fecha y precio; puedes cambiarlos en cada una.
            </p>
            {extras.map((linea, index) => {
              const opciones = ordenarCuentasPorCupo(cuentasPorPlat[linea.id_plataforma] || [])
              return (
                <div key={linea.key} className="rounded-lg border border-gray-700 bg-gray-900/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Plataforma extra {index + 1}</p>
                    <button
                      type="button"
                      onClick={() => quitarExtra(linea.key)}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="Quitar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Plataforma</label>
                      <select
                        value={linea.id_plataforma}
                        onChange={(e) => {
                          const idPlataforma = e.target.value
                          actualizarExtra(linea.key, { id_plataforma: idPlataforma, id_cuenta: '' })
                          cargarCuentasPlat(idPlataforma)
                        }}
                        className={fieldClass}
                      >
                        <option value="">Selecciona</option>
                        {plataformasExtra.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre_plat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Cuenta</label>
                      <select
                        value={linea.id_cuenta}
                        onChange={(e) => actualizarExtra(linea.key, { id_cuenta: e.target.value })}
                        className={fieldClass}
                        disabled={!linea.id_plataforma}
                      >
                        <option value="">{linea.id_plataforma ? 'Cuenta con cupo' : 'Elige plataforma'}</option>
                        {opciones.map((c) => {
                          const llena = cuentaLlena(c)
                          return (
                            <option key={c.id} value={c.id} disabled={llena}>
                              {etiquetaOpcionCuenta(c)}
                            </option>
                          )
                        })}
                      </select>
                    </div>
                    <InputField
                      id={`pin-extra-${linea.key}`}
                      label="PIN"
                      value={linea.pin}
                      onChange={(e) => actualizarExtra(linea.key, { pin: e.target.value })}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Vencimiento</label>
                      <input
                        type="date"
                        value={linea.vencimiento_usuario}
                        onChange={(e) => actualizarExtra(linea.key, { vencimiento_usuario: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <InputField
                        id={`venta-extra-${linea.key}`}
                        label="Precio de venta"
                        type="number"
                        value={linea.valor_venta}
                        onChange={(e) => actualizarExtra(linea.key, { valor_venta: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Notas</label>
                      <textarea
                        rows={2}
                        value={linea.notas || ''}
                        onChange={(e) => actualizarExtra(linea.key, { notas: e.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            <Button type="button" size="sm" variant="secondary" onClick={agregarExtra}>
              <Plus className="h-3.5 w-3.5" />
              Agregar plataforma
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {esEdicion ? 'Guardar cambios' : 'Asignar a la cuenta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
