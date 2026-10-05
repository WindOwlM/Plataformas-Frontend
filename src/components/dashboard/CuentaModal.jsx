import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useApi } from '../../hooks/useApi'
import InputField from '../ui/InputField'
import AutocompleteField from '../ui/AutocompleteField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { fieldClass } from '../ui/fieldStyles'

export default function CuentaModal({ isOpen, onClose, onSubmit, cuenta }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [idPlataforma, setIdPlataforma] = useState('')
  const [idProveedor, setIdProveedor] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [notas, setNotas] = useState('')
  const [puestos, setPuestos] = useState([
    { id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' },
  ])
  const [plataformas, setPlataformas] = useState([])
  const [proveedores, setProveedores] = useState([])
  const [clientes, setClientes] = useState([])
  const [catalogosLoading, setCatalogosLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { request } = useApi()

  const esEdicion = !!cuenta?.id

  useEffect(() => {
    if (isOpen) {
      cargarCatalogos()
      if (esEdicion) {
        setCorreo(cuenta.correo || '')
        setIdPlataforma(cuenta.id_plataforma || '')
        setIdProveedor(cuenta.id_proveedor || '')
        setPrecioCosto(cuenta.precio_costo || '')
        setFechaVencimiento(cuenta.fecha_vencimiento || '')
        setNotas(cuenta.notas || '')
        setContrasena('')
        const puestosExistentes = cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []
        if (puestosExistentes.length > 0) {
          setPuestos(puestosExistentes.map((p) => ({
            id: p.id,
            id_usuario: p.id_usuario || '',
            pin: p.pin || '',
            vencimiento_usuario: p.vencimiento_usuario || '',
            es_combo: p.es_combo || false,
            valor_venta: p.valor_venta || '',
          })))
        } else {
          setPuestos([{ id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' }])
        }
      } else {
        setCorreo('')
        setContrasena('')
        setIdPlataforma('')
        setIdProveedor('')
        setPrecioCosto('')
        setFechaVencimiento('')
        setNotas('')
        setPuestos([{ id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' }])
      }
    }
  }, [isOpen, cuenta])

  async function cargarCatalogos() {
    setCatalogosLoading(true)
    try {
      const [platRes, provRes, cliRes] = await Promise.all([
        request('/catalogos/plataformas'),
        request('/catalogos/proveedores'),
        request('/clientes'),
      ])
      if (platRes.data) setPlataformas(platRes.data)
      if (provRes.data) setProveedores(provRes.data)
      if (cliRes.data) setClientes(cliRes.data)
    } catch (err) {
      console.error('Error cargando catálogos:', err)
    } finally {
      setCatalogosLoading(false)
    }
  }

  function agregarPuesto() {
    setPuestos((prev) => [
      ...prev,
      { id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' },
    ])
  }

  function eliminarPuesto(index) {
    if (puestos.length === 1) return
    setPuestos(puestos.filter((_, i) => i !== index))
  }

  function actualizarPuesto(index, campo, valor) {
    const nuevosPuestos = [...puestos]
    nuevosPuestos[index] = { ...nuevosPuestos[index], [campo]: valor }
    setPuestos(nuevosPuestos)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!correo.trim()) return

    setIsLoading(true)

    const puestosPayload = puestos.map((p) => ({
      ...(p.id ? { id: p.id } : {}),
      id_cuenta: cuenta?.id || null,
      id_usuario: p.id_usuario || null,
      pin: p.pin || null,
      vencimiento_usuario: p.vencimiento_usuario || null,
      es_combo: p.es_combo || false,
      valor_venta: parseFloat(p.valor_venta) || 0,
    }))

    const cuentaData = {
      correo: correo.trim(),
      id_plataforma: idPlataforma,
      id_proveedor: idProveedor,
      precio_costo: parseFloat(precioCosto) || 0,
      fecha_vencimiento: fechaVencimiento || null,
      notas: notas || null,
      puestos: puestosPayload,
      usuarios_cuenta: puestosPayload,
      usuario_cuenta: puestosPayload,
    }

    if (contrasena.trim()) {
      cuentaData.contrasena = contrasena.trim()
    }

    await onSubmit(cuentaData)
    setIsLoading(false)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Editar cuenta' : 'Nueva cuenta'}
      subtitle={esEdicion ? cuenta.correo : 'Datos de la cuenta y puestos'}
      maxWidth="max-w-3xl"
    >
      {catalogosLoading && (
        <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
          <p className="text-sm text-indigo-300 text-center">Cargando catálogos...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-300">Datos de la cuenta</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutocompleteField
              id="plataforma"
              label="Plataforma *"
              placeholder="Buscar plataforma..."
              value={idPlataforma}
              onChange={setIdPlataforma}
              options={plataformas}
              getOptionLabel={(opt) => opt.nombre_plat}
              getOptionValue={(opt) => opt.id}
              required={!esEdicion}
            />
            <AutocompleteField
              id="proveedor"
              label="Proveedor *"
              placeholder="Buscar proveedor..."
              value={idProveedor}
              onChange={setIdProveedor}
              options={proveedores}
              getOptionLabel={(opt) => opt.nombre_prov}
              getOptionValue={(opt) => opt.id}
              required={!esEdicion}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="correo"
              label="Correo de la cuenta *"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
            <InputField
              id="contrasena"
              label={esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
              type="text"
              placeholder={esEdicion ? 'Dejar vacío para no cambiar' : 'Contraseña del servicio'}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              required={!esEdicion}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              id="precio"
              label="Precio de costo"
              type="number"
              value={precioCosto}
              onChange={(e) => setPrecioCosto(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Fecha de vencimiento</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className={fieldClass}
              />
            </div>
            <InputField
              id="notas"
              label="Notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-300">Puestos / perfiles</h4>
            <Button type="button" size="sm" onClick={agregarPuesto}>
              <Plus className="h-4 w-4" />
              Agregar puesto
            </Button>
          </div>

          <div className="space-y-3">
            {puestos.map((puesto, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border ${
                  puesto.id_usuario
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-gray-800/50 border-gray-600/40 border-dashed'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-300">
                    Puesto #{index + 1}
                    {puesto.id_usuario && <span className="ml-2 text-xs text-indigo-400">Asignado</span>}
                  </span>
                  {puestos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarPuesto(index)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <AutocompleteField
                    id={`cliente-${index}`}
                    label="Cliente"
                    placeholder="Buscar cliente..."
                    value={puesto.id_usuario}
                    onChange={(val) => actualizarPuesto(index, 'id_usuario', val)}
                    options={clientes}
                    getOptionLabel={(opt) => opt.nombre}
                    getOptionValue={(opt) => opt.id}
                  />
                  <InputField
                    id={`pin-${index}`}
                    label="PIN / Clave"
                    placeholder="PIN del perfil"
                    value={puesto.pin}
                    onChange={(e) => actualizarPuesto(index, 'pin', e.target.value)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Vence el</label>
                    <input
                      type="date"
                      value={puesto.vencimiento_usuario}
                      onChange={(e) => actualizarPuesto(index, 'vencimiento_usuario', e.target.value)}
                      className={fieldClass}
                    />
                  </div>
                  <InputField
                    id={`precio-venta-${index}`}
                    label="Precio venta"
                    type="number"
                    placeholder="0.00"
                    value={puesto.valor_venta}
                    onChange={(e) => actualizarPuesto(index, 'valor_venta', e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <input
                    type="checkbox"
                    checked={puesto.es_combo}
                    onChange={(e) => actualizarPuesto(index, 'es_combo', e.target.checked)}
                    className="rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-gray-400">Es combo (múltiples servicios)</span>
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {esEdicion ? 'Guardar cambios' : `Crear cuenta (${puestos.length} puesto${puestos.length > 1 ? 's' : ''})`}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
