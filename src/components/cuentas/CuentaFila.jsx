import { memo, useEffect, useRef, useState } from 'react'
import {
  ArrowRightLeft,
  Ban,
  Check,
  ChevronRight,
  ClipboardCopy,
  Copy,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Scissors,
  Trash2,
  Undo2,
  UserPlus,
} from 'lucide-react'
import Button from '../ui/Button'
import FechaBadge from '../ui/FechaBadge'
import CorteBadges, { CorteBadgePuesto } from '../ui/CorteBadges'
import EtiquetaDebe from '../ui/EtiquetaDebe'
import EtiquetaSaldo from '../ui/EtiquetaSaldo'
import { claseFila } from '../../lib/filaSeleccion'
import { cuentaInhabilitada, cuentaLlena } from '../../lib/cuentaEstado'
import { esComboPuesto } from '../../lib/agruparCuentas'
import { enlaceWhatsApp, formatSaldo, mensajeDatosCuenta, puestoCortado, resumenCorte } from '../../lib/vencimientos'

// Solo las cuentas propias (correos tuyos) o las que ya tienen el correo conectado
function puedeVerCorreos(cuenta, correoVinculado) {
  return correoVinculado || /^propia/i.test(cuenta?.proveedor?.nombre_prov || '')
}

// Menú "⋯" con las acciones menos usadas
export function MenuAcciones({ items, etiqueta = 'Más opciones' }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!abierto) return
    function cerrar(e) {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', cerrar)
    document.addEventListener('touchstart', cerrar)
    document.addEventListener('keydown', cerrar)
    return () => {
      document.removeEventListener('mousedown', cerrar)
      document.removeEventListener('touchstart', cerrar)
      document.removeEventListener('keydown', cerrar)
    }
  }, [abierto])

  const visibles = items.filter((i) => i && !i.oculto)
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={etiqueta}
        title={etiqueta}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {abierto ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 min-w-[13rem] rounded-xl border border-gray-700 bg-gray-900 p-1 shadow-xl shadow-black/50"
        >
          {visibles.map((item, i) =>
            item.separador ? (
              <div key={`sep-${i}`} className="my-1 border-t border-gray-700" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setAbierto(false)
                  item.onClick()
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-40 ${
                  item.peligro ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-200 hover:bg-gray-700'
                }`}
              >
                {item.icono ? <item.icono className="h-4 w-4 shrink-0" /> : null}
                {item.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  )
}

function BotonCopiar({ texto, titulo }) {
  const [ok, setOk] = useState(false)
  if (!texto) return null
  return (
    <button
      type="button"
      className={`p-1 rounded ${ok ? 'text-emerald-400' : 'text-gray-500 hover:text-white'}`}
      title={ok ? 'Copiado' : titulo}
      aria-label={titulo}
      onClick={async (e) => {
        e.stopPropagation()
        try {
          await navigator.clipboard.writeText(texto)
          setOk(true)
          setTimeout(() => setOk(false), 1200)
        } catch {
          setOk(false)
        }
      }}
    >
      {ok ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

// Puestos como cuadritos: azul = ocupado, rojo = por quitar del perfil
function BarraPuestos({ cuenta, puestos }) {
  const max = Number(cuenta.max_puestos) || 5
  const ocupados = Number(cuenta.ocupados ?? puestos.length) || 0
  const { cortados } = resumenCorte(puestos)
  const libres = Math.max(0, max - ocupados)
  const cuadros = Math.max(max, ocupados)
  return (
    <div className="space-y-1 min-w-0">
      <div className="flex gap-[3px] max-w-[9rem]" aria-hidden="true">
        {Array.from({ length: cuadros }, (_, i) => (
          <span
            key={`o-${i}`}
            className={`h-1.5 flex-1 rounded-full ${i < ocupados ? (i >= max ? 'bg-amber-400' : 'bg-indigo-500') : 'bg-gray-700'}`}
          />
        ))}
        {Array.from({ length: cortados }, (_, i) => (
          <span key={`c-${i}`} className="h-1.5 flex-1 rounded-full bg-red-400" />
        ))}
      </div>
      <p className="text-xs text-gray-400 tabular-nums">
        {ocupados}/{max}
        {' · '}
        {libres === 0 ? (
          <span className="text-amber-300">Llena</span>
        ) : (
          `${libres} libre${libres === 1 ? '' : 's'}`
        )}
        {cortados ? <span className="text-red-300"> · {cortados} por quitar</span> : null}
      </p>
    </div>
  )
}

function BotonCopiarDatos({ cuenta, puesto }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensajeDatosCuenta(cuenta, puesto))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      setCopiado(false)
    }
  }
  return (
    <Button size="sm" variant="secondary" onClick={copiar}>
      {copiado ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <ClipboardCopy className="h-3.5 w-3.5" />}
      {copiado ? 'Copiado' : 'Copiar datos'}
    </Button>
  )
}

function TarjetaCliente({
  cuenta,
  puesto,
  cuentas,
  deuda,
  resaltada,
  seleccionada,
  onCortar,
  onEditarPuesto,
  onQuitar,
  onBorrarDefinitivo,
  onDeshacerCortado,
  onReubicar,
}) {
  const recordatorio = puestoCortado(puesto)
  const nombre = puesto.usuario?.nombre || 'Sin cliente'
  const telefono = puesto.usuario?.numero_telefono || ''
  const enlace = enlaceWhatsApp(telefono, mensajeDatosCuenta(cuenta, puesto))

  const etiquetas = (
    <>
      {esComboPuesto(puesto, cuentas) ? (
        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide bg-purple-500/20 text-purple-300 border border-purple-500/30">
          Combo
        </span>
      ) : null}
      <CorteBadgePuesto puesto={puesto} />
      <EtiquetaDebe deuda={deuda} />
      <EtiquetaSaldo deuda={deuda} />
    </>
  )

  if (recordatorio) {
    return (
      <div
        className={claseFila(
          seleccionada,
          'rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3'
        )}
      >
        <div className="min-w-0">
          <p className="text-white font-medium flex flex-wrap items-center gap-2">
            {nombre}
            {etiquetas}
          </p>
          <p className="text-xs text-red-300 mt-0.5 break-words">
            Recuerda quitarlo del perfil en {cuenta.correo} y luego bórralo de aquí
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button size="sm" variant="secondary" onClick={() => onDeshacerCortado(cuenta, puesto)} title="Me equivoqué: devolver el cliente a la cuenta">
            <Undo2 className="h-3.5 w-3.5" />
            Deshacer
          </Button>
          <Button size="sm" variant="danger" onClick={() => onBorrarDefinitivo(cuenta, puesto)} title="Ya lo quitaste del perfil: borrar recordatorio">
            <Trash2 className="h-3.5 w-3.5" />
            Borrar de esta cuenta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={claseFila(
        seleccionada,
        `rounded-xl border p-3 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_4.5rem_9rem_5.5rem_19rem] gap-x-3 gap-y-2 items-center ${
          resaltada ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-700/80 bg-gray-800'
        }`
      )}
    >
      <div className="min-w-0">
        <p className="text-white font-medium flex flex-wrap items-center gap-2">
          {nombre}
          {etiquetas}
        </p>
        <p className="text-xs text-gray-400">{telefono || 'Sin teléfono'}</p>
        {puesto.notas ? (
          <p className="text-xs text-amber-200/90 mt-0.5 whitespace-pre-wrap break-words">{puesto.notas}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 xl:contents">
        <div className="min-w-0">
          <p className="xl:hidden text-[10px] uppercase tracking-wide text-gray-500">PIN</p>
          <p className="font-mono text-sm text-gray-200">{puesto.pin || '—'}</p>
        </div>
        <div className="min-w-0 text-sm">
          <p className="xl:hidden text-[10px] uppercase tracking-wide text-gray-500">Vence</p>
          <FechaBadge fecha={puesto.vencimiento_usuario} />
        </div>
        <div className="min-w-0">
          <p className="xl:hidden text-[10px] uppercase tracking-wide text-gray-500">Precio</p>
          <p className="text-sm text-gray-200 tabular-nums">
            {puesto.valor_venta != null ? formatSaldo(puesto.valor_venta) : '—'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 xl:justify-end">
        <BotonCopiarDatos cuenta={cuenta} puesto={puesto} />
        {enlace ? (
          <Button size="sm" variant="success" onClick={() => window.open(enlace, 'whatsapp-plataformas')}>
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>
        ) : null}
        <MenuAcciones
          etiqueta={`Más opciones de ${nombre}`}
          items={[
            { label: 'Editar PIN, precio y fecha', icono: Pencil, onClick: () => onEditarPuesto(cuenta, puesto) },
            { label: 'Reubicar a otra cuenta', icono: ArrowRightLeft, onClick: () => onReubicar(cuenta, puesto) },
            { separador: true },
            { label: 'Cortar (marcar para quitar)', icono: Scissors, peligro: true, onClick: () => onCortar({ cuenta, puesto }) },
            { label: 'Quitar de la cuenta', icono: Trash2, peligro: true, onClick: () => onQuitar(cuenta, puesto) },
          ]}
        />
      </div>
    </div>
  )
}

// Una cuenta: fila con lo principal; al tocarla se despliegan sus clientes
const CuentaFila = memo(function CuentaFila({
  cuenta,
  puestos,
  expanded,
  cuentas,
  clienteId,
  deudas,
  soloInhabilitadas,
  onToggle,
  onAsignar,
  onEditarCuenta,
  onEditarPuesto,
  onQuitar,
  onEliminarCuenta,
  onCorreos,
  correoVinculado,
  onInhabilitar,
  onHabilitar,
  onCortar,
  onBorrarDefinitivo,
  onDeshacerCortado,
  onReubicar,
  seleccionada,
  puestoSeleccionadoId,
}) {
  const llena = cuentaLlena(cuenta)
  const inhabilitada = cuentaInhabilitada(cuenta)
  const libres = Math.max(0, (Number(cuenta.max_puestos) || 5) - (Number(cuenta.ocupados ?? puestos.length) || 0))
  const verCorreos = puedeVerCorreos(cuenta, correoVinculado)

  function alTocarFila(e) {
    // Los botones y menús de la fila no despliegan la cuenta
    if (e.target.closest('button, a, input, select, [role="menu"]')) return
    onToggle(cuenta.id)
  }

  const botonPrincipal = soloInhabilitadas || inhabilitada ? (
    <Button size="sm" variant="secondary" onClick={() => onHabilitar(cuenta)}>
      <Ban className="h-3.5 w-3.5" />
      Habilitar
    </Button>
  ) : (
    <Button size="sm" onClick={() => onAsignar(cuenta)} disabled={llena} title={llena ? 'La cuenta está llena' : 'Asignar un cliente'}>
      <UserPlus className="h-3.5 w-3.5" />
      {llena ? 'Llena' : 'Asignar'}
    </Button>
  )

  return (
    <div className={inhabilitada && !soloInhabilitadas ? 'opacity-70' : ''}>
      <div
        onClick={alTocarFila}
        className={claseFila(
          seleccionada,
          `px-3 sm:px-4 py-3 cursor-pointer transition-colors grid grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_8.5rem_auto] gap-x-3 gap-y-2 items-center ${
            expanded ? 'bg-gray-700/30' : 'hover:bg-gray-700/40'
          }`
        )}
      >
        <button
          type="button"
          onClick={() => onToggle(cuenta.id)}
          className="p-1 -ml-1 rounded text-gray-400 hover:text-white self-start lg:self-center row-start-1"
          aria-expanded={expanded}
          aria-label={expanded ? 'Ocultar clientes' : 'Ver clientes'}
          title={expanded ? 'Ocultar clientes' : 'Ver clientes'}
        >
          <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-white font-semibold break-all">{cuenta.correo || 'Sin correo'}</span>
            <BotonCopiar texto={cuenta.correo} titulo="Copiar correo" />
            <CorteBadges puestos={puestos} cuenta={cuenta} />
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-gray-400">
            {cuenta.contrasena ? (
              <span className="inline-flex items-center">
                <span className="font-mono text-gray-300 break-all">{cuenta.contrasena}</span>
                <BotonCopiar texto={cuenta.contrasena} titulo="Copiar contraseña" />
              </span>
            ) : (
              <span>Sin contraseña</span>
            )}
            <span className="text-gray-600">·</span>
            <span>{cuenta.proveedor?.nombre_prov || 'Sin proveedor'}</span>
            <span className="text-gray-600">·</span>
            <span className="tabular-nums">
              {cuenta.precio_costo != null ? `${formatSaldo(cuenta.precio_costo)}/mes` : 'Sin costo'}
            </span>
            {inhabilitada ? (
              <span className="ml-1 inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border bg-gray-500/25 text-gray-300 border-gray-400/40">
                Inhabilitada
              </span>
            ) : null}
          </div>
        </div>

        <div className="col-start-2 row-start-4 lg:col-start-5 lg:row-start-1 flex items-center gap-1 lg:justify-end">
          {botonPrincipal}
          <MenuAcciones
            etiqueta={`Más opciones de ${cuenta.correo || 'la cuenta'}`}
            items={[
              { label: 'Editar cuenta', icono: Pencil, onClick: () => onEditarCuenta(cuenta) },
              {
                label: correoVinculado ? 'Ver correos' : 'Conectar correo',
                icono: Mail,
                oculto: !verCorreos,
                disabled: !cuenta.correo,
                onClick: () => onCorreos(cuenta.correo),
              },
              inhabilitada
                ? { label: 'Habilitar', icono: Ban, oculto: soloInhabilitadas, onClick: () => onHabilitar(cuenta) }
                : { label: 'Inhabilitar', icono: Ban, peligro: true, onClick: () => onInhabilitar(cuenta) },
              { separador: true },
              { label: 'Eliminar cuenta', icono: Trash2, peligro: true, onClick: () => onEliminarCuenta(cuenta) },
            ]}
          />
        </div>

        <div className="col-start-2 row-start-2 lg:col-start-3 lg:row-start-1 min-w-0">
          <BarraPuestos cuenta={cuenta} puestos={puestos} />
        </div>
        <div className="col-start-2 row-start-3 lg:col-start-4 lg:row-start-1 flex items-center gap-2 text-xs text-gray-400">
          <span className="lg:hidden">Vence</span>
          <FechaBadge fecha={cuenta.fecha_vencimiento} empty="Sin fecha" />
        </div>
      </div>

      {expanded ? (
        <div className="bg-gray-900/50 border-t border-gray-700/70 px-3 sm:px-4 lg:pl-12 py-3 space-y-2">
          {puestos.length === 0 && libres === 0 ? (
            <p className="text-sm text-gray-500">Esta cuenta no tiene clientes asignados</p>
          ) : null}
          {puestos.map((puesto, index) => (
            <TarjetaCliente
              key={puesto.id || index}
              cuenta={cuenta}
              puesto={puesto}
              cuentas={cuentas}
              deuda={deudas?.get(puesto.id_usuario)}
              resaltada={!!clienteId && puesto.id_usuario === clienteId}
              seleccionada={!!puestoSeleccionadoId && puesto.id === puestoSeleccionadoId}
              onCortar={onCortar}
              onEditarPuesto={onEditarPuesto}
              onQuitar={onQuitar}
              onBorrarDefinitivo={onBorrarDefinitivo}
              onDeshacerCortado={onDeshacerCortado}
              onReubicar={onReubicar}
            />
          ))}
          {libres > 0 && !inhabilitada ? (
            <div className="rounded-xl border border-dashed border-gray-600 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-gray-400">
                {libres} puesto{libres === 1 ? '' : 's'} libre{libres === 1 ? '' : 's'}
              </span>
              <Button size="sm" onClick={() => onAsignar(cuenta)}>
                <UserPlus className="h-3.5 w-3.5" />
                Asignar cliente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
})

export default CuentaFila
