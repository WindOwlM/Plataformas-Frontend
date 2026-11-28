import { useEffect } from 'react'
import { fieldClass } from '../ui/fieldStyles'
import { MEDIOS_PAGO } from '../../lib/pagos'
import { formatSaldo } from '../../lib/vencimientos'

// Recuadro de pago dentro de Renovar.
// tipo 'cobro' = lo que paga el cliente; 'gasto' = lo que pagas al proveedor.
export default function PagoRenovacion({ tipo = 'cobro', pago, onChange, sugerido = 0 }) {
  const esGasto = tipo === 'gasto'

  // El monto sigue al precio de las cuentas mientras no lo cambies a mano
  const montoSugerido = String(Math.round(Number(sugerido) || 0))
  useEffect(() => {
    if (!pago.editado && pago.monto !== montoSugerido) onChange({ ...pago, monto: montoSugerido })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montoSugerido, pago.editado, pago.monto])

  const modos = esGasto
    ? [
        { id: 'pagado', label: 'Ya pagué' },
        { id: 'pendiente', label: 'Le debo' },
        { id: 'no', label: 'No registrar' },
      ]
    : [
        { id: 'pagado', label: 'Pagó' },
        { id: 'pendiente', label: 'Fiado' },
        { id: 'no', label: 'No registrar' },
      ]

  const ayuda = {
    pagado: esGasto ? 'Queda como gasto de hoy.' : 'Queda como plata recibida hoy.',
    pendiente: esGasto
      ? 'Queda como deuda con el proveedor hasta que la marques pagada en Reportes.'
      : 'Se renueva, pero queda debiendo. Lo marcas como pagado en Reportes cuando te pague.',
    no: 'Solo cambia la fecha, sin guardar pago (para correcciones o cortesías).',
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/40 p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-white">{esGasto ? 'Pago al proveedor' : 'Pago del cliente'}</p>
        <div className="inline-flex rounded-lg border border-gray-700 overflow-hidden" role="radiogroup">
          {modos.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={pago.modo === m.id}
              onClick={() => onChange({ ...pago, modo: m.id })}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                pago.modo === m.id
                  ? m.id === 'pendiente'
                    ? 'bg-amber-500/25 text-amber-200'
                    : m.id === 'no'
                      ? 'bg-gray-600 text-white'
                      : 'bg-green-600/30 text-green-200'
                  : 'text-gray-400 hover:bg-gray-700/60'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {pago.modo !== 'no' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              {pago.modo === 'pendiente' ? 'Monto que queda debiendo' : 'Monto'}
            </label>
            <input
              type="number"
              min="0"
              step="100"
              inputMode="numeric"
              value={pago.monto}
              onChange={(e) => onChange({ ...pago, monto: e.target.value, editado: true })}
              className={fieldClass}
            />
            {pago.editado && Number(pago.monto) !== Math.round(Number(sugerido) || 0) ? (
              <button
                type="button"
                onClick={() => onChange({ ...pago, editado: false })}
                className="text-xs text-indigo-300 hover:underline mt-1"
              >
                Usar el precio de las cuentas ({formatSaldo(sugerido)})
              </button>
            ) : null}
          </div>
          {pago.modo === 'pagado' ? (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Medio de pago</label>
              <select
                value={pago.medio}
                onChange={(e) => onChange({ ...pago, medio: e.target.value })}
                className={fieldClass}
              >
                <option value="">Sin especificar</option>
                {MEDIOS_PAGO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="text-xs text-gray-500">{ayuda[pago.modo]}</p>
    </div>
  )
}
