export const CALCULATION_CONTEXT_CONTROL_ATTRIBUTE =
  'data-detail-modal-calculation-control' as const

export const CALCULATION_CONTEXT_CONTROL_PROPS = {
  [CALCULATION_CONTEXT_CONTROL_ATTRIBUTE]: '',
} as const

export function isCalculationContextControl(target: Element): boolean {
  return Boolean(target.closest(`[${CALCULATION_CONTEXT_CONTROL_ATTRIBUTE}]`))
}
