import { useState, useEffect } from 'react'
import { useApi } from '../../hooks/useApi'
import InputField from '../ui/InputField'
import AutocompleteField from '../ui/AutocompleteField'
import Button from '../ui/Button'

export default function CuentaModal({ isOpen, onClose, onSubmit, cuenta }) {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [idPlataforma, setIdPlataforma] = useState('')
  const [idProveedor, setIdProveedor] = useState('')
  const [precioCosto, setPrecioCosto] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [notas, setNotas] = useState('')
  
  // PUESTOS incluidos desde el inicio
  const [puestos, setPuestos] = useState([
    { id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' }
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
        // Cargar puestos existentes
        const puestosExistentes = cuenta.usuarios_cuenta || cuenta.usuario_cuenta || []
        if (puestosExistentes.length > 0) {
          setPuestos(puestosExistentes.map(p => ({
            id: p.id,
            id_usuario: p.id_usuario || '',
            pin: p.pin || '',
            vencimiento_usuario: p.vencimiento_usuario || '',
            es_combo: p.es_combo || false,
            valor_venta: p.valor_venta || ''
          })))
        } else {
          setPuestos([{ id_usuario: '', pin: '', vencimiento_usuario: '', es_combo: false, valor_venta: '' }])
        }
      } else {
        // Nueva cuenta
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
        request('/clientes')
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
      {
        id_usuario: '',
        pin: '',
        vencimiento_usuario: '',
        es_combo: false,
        valor_venta: '',
      },
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
      cuentaData.contrasena_plana = contrasena
    }

    console.log('Enviando cuentaData:', cuentaData) // DEBUG

    await onSubmit(cuentaData)
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-3xl border border-gray-700 my-8">
        <h3 className="text-xl font-bold text-white mb-1">
          {esEdicion ? 'Editar Cuenta' : 'Nueva Cuenta'}
        </h3>
        {esEdicion && <p className="text-sm text-gray-400 mb-4">{cuenta.correo}</p>}
        
        {catalogosLoading && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400 text-center">Cargando catálogos...</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Datos de la cuenta */}
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
                className="block w-full px-3 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <InputField
              id="notas"
              label="Notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* PUESTOS */}
          <div className="border-t border-gray-700 pt-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Puestos / Perfiles</h4>
              <button
                type="button"
                onClick={agregarPuesto}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar puesto
              </button>
            </div>

            <div className="space-y-3">
              {puestos.map((puesto, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border ${
                    puesto.id_usuario 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : 'bg-gray-700/30 border-gray-600/30 border-dashed'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-300">
                      Puesto #{index + 1}
                      {puesto.id_usuario && <span className="ml-2 text-xs text-blue-400">● Asignado</span>}
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
                      <label className="block text-xs text-gray-400 mb-1">Vence el</label>
                      <input
                        type="date"
                        value={puesto.vencimiento_usuario}
                        onChange={(e) => actualizarPuesto(index, 'vencimiento_usuario', e.target.value)}
                        className="block w-full px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                  <div className="mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={puesto.es_combo}
                        onChange={(e) => actualizarPuesto(index, 'es_combo', e.target.checked)}
                        className="rounded bg-gray-700 border-gray-600 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-400">Es combo (múltiples servicios)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {esEdicion ? 'Guardar Cambios' : `Crear Cuenta con ${puestos.length} puesto${puestos.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}