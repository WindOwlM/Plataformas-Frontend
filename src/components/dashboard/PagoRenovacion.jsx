import { useEffect } from 'react'
import { fieldClass } from '../ui/fieldStyles'
import { MEDIOS_PAGO, calcularSaldo } from '../../lib/pagos'
import { formatSaldo } from '../../lib/vencimientos'

// Recuadro de pago dentro de Renovar.
// tipo 'cobro' = lo que paga el cliente; 'gasto' = lo que pagas al proveedor.
export default function PagoRenovacion({ tipo = 'cobro', pago, onChange, sugerido = 0, saldo = 0 }) {
  const esGasto = tipo === 'gasto'
  const { usado, aPagar: total, total: totalCuentas, disponible } = calcularSaldo(
    pago,
    sugerido,
    esGasto ? 0 : saldo
  )
  const saldoCubreTodo = usado > 0 && total === 0
  const montoSugerido = String(total)

  // En "Pagó" el monto sigue al precio de las cuentas mientras no lo cambies a mano
  useEffect(() => {
    if (pago.modo === 'pagado' && !pago.editado && pago.monto !== montoSugerido) {
      onChange({ ...pago, monto: montoSugerido })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoSugerido, pago.editado, pago.monto, pago.modo])

  function cambiarModo(modo) {
    if (modo === pago.modo) return
    // "Pagó una parte" empieza vacío para escribir lo que pagó; "Pagó" vuelve al total
    if (modo === 'parcial') onChange({ ...pago, modo, monto: '', editado: true })
    else if (modo === 'pagado') onChange({ ...pago, modo, monto: montoSugerido, editado: false })
    else onChange({ ...pago, modo })
  }

  const modos = esGasto
    ? [
        { id: 'pagado', label: 'Ya pagué' },
        { id: 'parcial', label: 'Pagué una parte' },
        { id: 'pendiente', label: 'Le debo' },
        { id: 'no', label: 'No registrar' },
      ]
    : [
        { id: 'pagado', label: 'Pagó' },
        { id: 'parcial', label: 'Pagó una parte' },
        { id: 'pendiente', label: 'Fiado' },
        { id: 'no', label: 'No registrar' },
      ]

  const pagadoAhora = Number(pago.monto) || 0
  const resta = Math.max(0, total - pagadoAhora)

  const ayuda = {
    pagado: esGasto ? 'Queda como gasto de hoy.' : 'Queda como plata recibida hoy.',
    parcial: esGasto
      ? 'Lo que pagas hoy queda como gasto y el resto como deuda con el proveedor.'
      : 'Lo que pagó hoy queda como cobrado y el resto como fiado ("Debe").',
    pendiente: esGasto
      ? 'Queda toda la deuda con el proveedor hasta que la marques pagada en Reportes.'
      : 'Se renueva, pero queda debiendo todo. Lo marcas como pagado en Reportes cuando te pague.',
    no: 'Solo cambia la fecha, sin guardar pago (para correcciones o cortesías).',
  }

  const estiloActivo = {
    pagado: 'bg-green-600/30 text-green-200',
    parcial: 'bg-sky-600/30 text-sky-200',
    pendiente: 'bg-amber-500/25 text-amber-200',
    no: 'bg-gray-600 text-white',
  }

  const selectorMedio = (
    <div>
      <label className="block text-xs text-gray-400 mb-1">Medio de pago</label>
      <select value={pago.medio} onChange={(e) => onChange({ ...pago, medio: e.target.value })} className={fieldClass}>
        <option value="">Sin especificar</option>
        {MEDIOS_PAGO.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 space-y-3">
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-medium text-white">{esGasto ? 'Pago al proveedor' : 'Pago del cliente'}</p>
          <p className="text-xs text-gray-400">
            Total de las cuentas: <span className="text-white tabular-nums">{formatSaldo(totalCuentas)}</span>
          </p>
        </div>
        {!esGasto && disponible > 0 ? (
          <label className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 cursor-pointer">
            <input
              type="checkbox"
              checked={!!pago.usarSaldo}
              disabled={pago.modo === 'no'}
              onChange={(e) => onChange({ ...pago, usarSaldo: e.target.checked, editado: false })}
              className="h-4 w-4 rounded border-gray-600 bg-gray-900"
            />
            Usar saldo a favor (tiene {formatSaldo(disponible)})
            {usado > 0 ? (
              <span className="text-emerald-200/80">
                · se descuentan {formatSaldo(usado)}, queda por pagar {formatSaldo(total)}
              </span>
            ) : null}
          </label>
        ) : null}
        <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-gray-700 overflow-hidden" role="radiogroup">
          {modos.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={pago.modo === m.id}
              onClick={() => cambiarModo(m.id)}
              className={`px-2 py-1.5 text-xs font-medium transition-colors ${
                pago.modo === m.id ? estiloActivo[m.id] : 'text-gray-400 hover:bg-gray-700/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {saldoCubreTodo ? (
        <p className="text-sm text-emerald-200">
          El saldo a favor cubre todo. Le quedan {formatSaldo(disponible - usado)} a favor y no se registra cobro.
        </p>
      ) : null}

      {pago.modo === 'pagado' && !saldoCubreTodo ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Monto</label>
            <input
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
              value={pago.monto}
              onChange={(e) => onChange({ ...pago, monto: e.target.value, editado: true })}
              className={fieldClass}
            />
            {pago.editado && Number(pago.monto) !== total ? (
              <button
                type="button"
                onClick={() => onChange({ ...pago, editado: false })}
                className="text-xs text-indigo-300 hover:underline mt-1"
              >
                Usar el total ({formatSaldo(total)})
              </button>
            ) : null}
          </div>
          {selectorMedio}
        </div>
      ) : null}

      {pago.modo === 'parcial' && !saldoCubreTodo ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{esGasto ? 'Pagas ahora' : 'Pagó ahora'}</label>
              <input
                type="number"
                min="0"
                step="100"
                inputMode="numeric"
                value={pago.monto}
                onChange={(e) => onChange({ ...pago, monto: e.target.value, editado: true })}
                className={fieldClass}
                placeholder="0"
              />
            </div>
            {selectorMedio}
          </div>
          <p className="text-sm text-gray-300">
            {esGasto ? 'Quedas debiendo' : 'Queda debiendo'}:{' '}
            <span className="font-semibold text-amber-200 tabular-nums">{formatSaldo(resta)}</span>
          </p>
        </div>
      ) : null}

      {pago.modo === 'pendiente' && !saldoCubreTodo ? (
        <p className="text-sm text-gray-300">
          {esGasto ? 'Quedas debiendo' : 'Queda debiendo'}:{' '}
          <span className="font-semibold text-amber-200 tabular-nums">{formatSaldo(total)}</span>
          <span className="text-gray-500">{usado > 0 ? ' (después del saldo a favor)' : ' (el total de las cuentas)'}</span>
        </p>
      ) : null}

      {!saldoCubreTodo ? <p className="text-xs text-gray-500">{ayuda[pago.modo]}</p> : null}
    </div>
  )
}
