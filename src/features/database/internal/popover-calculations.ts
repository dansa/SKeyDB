import type {PublicDescriptionArg} from '@/domain/public-description-args'
import {fmtNum} from '@/domain/scaling'

export interface BaseModifierResult {
  multiplier: number
  flatIncrease: number
  multipliers?: number[]
}

/**
 * Helper to round and format floats safely to up to 3 decimal places.
 */
function formatNumber(num: number): string {
  return parseFloat(num.toFixed(3)).toString()
}

/**
 * Formats modifier multiplier values by converting precision figures to readable strings.
 * @param baseModifier The calculated base modifier configuration.
 * @returns Bounded formatted multiplier string.
 */
function formatMultiplier(baseModifier: BaseModifierResult): string {
  const multipliers = baseModifier.multipliers
  if (multipliers && multipliers.length > 0) {
    return multipliers.map(formatNumber).join(' × ')
  }
  return formatNumber(baseModifier.multiplier)
}

/**
 * Safe retrieval of a progression step relative to the level range start.
 * @param steps Array of possible steps.
 * @param level Current target level.
 * @param levelStart Initial base level.
 * @returns Progression step or null.
 */
export function getSafeProgressionStep<T>(
  steps: T[] | null | undefined,
  level: number,
  levelStart: number,
): T | null {
  if (!steps) {
    return null
  }

  const index = level - levelStart
  if (index < 0 || index >= steps.length) {
    return null
  }

  return steps[index] ?? null
}

/**
 * Calculates base modifiers and multiplier rates between live and original values.
 * @returns Bounded modifier details, or null.
 */
export function calculateBaseModifier(params: {
  liveProgression: {baseValue: number | null}[] | null
  originalProgression: {baseValue: number | null}[] | null
  activeLevel: number
  levelStart: number
  getMultipliers: (index: number) => number[] | undefined
}): BaseModifierResult | null {
  if (!params.liveProgression || !params.originalProgression) {
    return null
  }

  const activeLevelIndex = params.activeLevel - params.levelStart
  if (
    activeLevelIndex < 0 ||
    activeLevelIndex >= params.liveProgression.length ||
    activeLevelIndex >= params.originalProgression.length
  ) {
    return null
  }

  const liveItem = params.liveProgression[activeLevelIndex]
  const originalItem = params.originalProgression[activeLevelIndex]

  const activeBaseVal = liveItem.baseValue
  const activeOrigBaseVal = originalItem.baseValue
  if (activeBaseVal === null || activeOrigBaseVal === null || activeOrigBaseVal === 0) {
    return null
  }

  if (activeBaseVal !== activeOrigBaseVal) {
    const multiplier = activeBaseVal / activeOrigBaseVal
    const flatIncrease = activeBaseVal - activeOrigBaseVal
    const multipliers = params.getMultipliers(activeLevelIndex)
    return {multiplier, flatIncrease, multipliers}
  }

  return null
}

export interface CompileAbstractFormulaParams {
  liveArg: PublicDescriptionArg | undefined
  suffix: string
  baseModifier: BaseModifierResult | null
  fallbackFormula?: string
}

/**
 * Formulates and compiles mathematical expressions describing scaling stats.
 * @returns The formatted formula string, or undefined.
 */
export function compileAbstractFormula({
  liveArg,
  suffix,
  baseModifier,
  fallbackFormula,
}: CompileAbstractFormulaParams): string | undefined {
  if (!liveArg) {
    return fallbackFormula
  }

  if (!liveArg.substatBonus) {
    if (baseModifier) {
      if (suffix.includes('%')) {
        const fmtMult = formatMultiplier(baseModifier)
        return `base × ${fmtMult}`
      } else {
        const sign = baseModifier.flatIncrease >= 0 ? '+' : '-'
        const absFlat = fmtNum(Math.abs(baseModifier.flatIncrease))
        return `base ${sign} ${absFlat}${suffix}`
      }
    }
    return fallbackFormula
  }

  const source = liveArg.substatBonus.substat.replace(/([a-z])([A-Z])/g, '$1 $2')
  const mult = liveArg.substatBonus.multiplier
  const mode = liveArg.substatBonus.mode ?? (suffix.includes('%') ? 'scale_base' : 'additive')
  const baseMult = liveArg.substatBonus.baseMultiplier ?? '1'

  if (mode === 'scale_base') {
    if (baseModifier) {
      const fmtMult = formatMultiplier(baseModifier)
      return `base × ${fmtMult} × (1 + ${source} × ${mult})`
    }
    return `base × (1 + ${source} × ${mult})`
  } else if (mode === 'additive_factor') {
    if (baseModifier) {
      const fmtMult = formatMultiplier(baseModifier)
      return `base × ${fmtMult} × (${baseMult} + ${source} × ${mult})`
    }
    return `base × (${baseMult} + ${source} × ${mult})`
  } else {
    if (baseModifier) {
      const sign = baseModifier.flatIncrease >= 0 ? '+' : '-'
      const absFlat = fmtNum(Math.abs(baseModifier.flatIncrease))
      return `base ${sign} ${absFlat}${suffix} + ${source} × ${mult}`
    }
    return `base + ${source} × ${mult}`
  }
}
