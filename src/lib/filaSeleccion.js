export const FILA_SELECCIONADA =
  'bg-amber-400/25 outline outline-2 outline-amber-300 outline-offset-[-2px] shadow-[inset_0_0_40px_rgba(251,191,36,0.18)]'

export function claseFila(seleccionada, extra = '') {
  return [extra, seleccionada ? FILA_SELECCIONADA : '']
    .filter(Boolean)
    .join(' ')
}
