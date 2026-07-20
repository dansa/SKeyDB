import {resolveAccountLevelCurveEntry} from './gameplay-math-metadata'
import type {
  PublicComputedDescriptionArg,
  PublicScaledFormulaDescriptionArg,
  PublicScaledBaseFormula,
} from './public-description-args.schema'
import {buildPublicFormulaContext, type PublicFormulaContext} from './public-formula-context'

export type {PublicFormulaContext} from './public-formula-context'
export type {
  PublicComputedDescriptionArg,
  PublicDescriptionArg,
  PublicDescriptionArgStat,
  PublicDescriptionArgSubstatBonus,
  PublicFixedDescriptionArg,
  PublicFormulaKey,
  PublicLinearDescriptionArg,
  PublicRealmMasteryLinearComputedDescriptionArg,
  PublicScaledFormulaDescriptionArg,
  PublicScaledBaseFormula,
  PublicScaledCeilThenMultiplyComputedDescriptionArg,
  PublicScaledComputedDescriptionArg,
  PublicScalingDescriptionArg,
  PublicWheelRefinementLinearComputedDescriptionArg,
} from './public-description-args.schema'

export interface PublicFormulaEvaluation {
  resolved: boolean
  value: number | null
}

export interface PublicScaledFormulaBreakdown {
  title: string
  accountLevel: number
  baseLabel: string
  baseLabelPlacement: 'before' | 'after'
  baseValue: number
  ownedPosseCount: number | null
  ownedPosseMultiplier: number | null
  multiplier: number | null
}

function unresolved(): PublicFormulaEvaluation {
  return {
    resolved: false,
    value: null,
  }
}

function resolved(value: number): PublicFormulaEvaluation {
  if (!Number.isFinite(value)) {
    return unresolved()
  }

  return {
    resolved: true,
    value,
  }
}

function isPublicComputedDescriptionArg(value: unknown): value is PublicComputedDescriptionArg {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as {kind?: unknown; formulaKey?: unknown}
  return (
    candidate.kind === 'computed' &&
    (candidate.formulaKey === 'scaled' ||
      candidate.formulaKey === 'scaledCeilThenMultiply' ||
      candidate.formulaKey === 'wheelRefinementLinear' ||
      candidate.formulaKey === 'realmMasteryLinear')
  )
}

function resolveScaledBaseFormula(
  baseFormula: PublicScaledBaseFormula,
  context: PublicFormulaContext,
): PublicFormulaEvaluation {
  const resolvedContext = {...buildPublicFormulaContext(), ...context}
  const curve = resolveAccountLevelCurveEntry(resolvedContext.accountLevel)

  switch (baseFormula) {
    case 'accountStageGrowth':
      return resolved(curve.stageGrow)
    case 'somaticResearchHpMultiplier':
      return resolved(curve.hpMultiplier)
    case 'esotericResearchDepth':
      return resolved(curve.stageGrow)
    case 'occultResearchDepth':
      return resolved(curve.stageGrow * (curve.accountDamagePower / 100))
    case 'occultResearchMultiplier':
      return resolved(curve.accountDamagePower / 100)
  }

  return unresolved()
}

export function getPublicScaledFormulaBreakdown(
  arg: PublicScaledFormulaDescriptionArg,
  context: PublicFormulaContext = {},
): PublicScaledFormulaBreakdown {
  const resolvedContext = {...buildPublicFormulaContext(), ...context}
  const curve = resolveAccountLevelCurveEntry(resolvedContext.accountLevel)
  const ownedPosseCount = Math.min(resolvedContext.ownedPosseCount ?? 0, 50)
  const ownedPosseMultiplier = 1 + ownedPosseCount * 0.01
  const multiplier =
    typeof arg.multiplier === 'number' && Number.isFinite(arg.multiplier) ? arg.multiplier : null

  switch (arg.baseFormula) {
    case 'accountStageGrowth':
      return {
        title: 'Account Growth Bonus',
        accountLevel: curve.accountLevel,
        baseLabel: 'base growth',
        baseLabelPlacement: 'after',
        baseValue: curve.stageGrow,
        ownedPosseCount: null,
        ownedPosseMultiplier: null,
        multiplier,
      }
    case 'somaticResearchHpMultiplier':
      return {
        title: 'Forbidden Lore Scaling',
        accountLevel: curve.accountLevel,
        baseLabel: 'Somatic Research',
        baseLabelPlacement: 'before',
        baseValue: curve.hpMultiplier,
        ownedPosseCount: null,
        ownedPosseMultiplier: null,
        multiplier,
      }
    case 'esotericResearchDepth':
      return {
        title: 'Forbidden Lore Scaling',
        accountLevel: curve.accountLevel,
        baseLabel: 'Esoteric Research',
        baseLabelPlacement: 'before',
        baseValue: curve.stageGrow,
        ownedPosseCount,
        ownedPosseMultiplier,
        multiplier,
      }
    case 'occultResearchDepth':
      return {
        title: 'Forbidden Lore Scaling',
        accountLevel: curve.accountLevel,
        baseLabel: 'Occult Research',
        baseLabelPlacement: 'before',
        baseValue: curve.stageGrow * (curve.accountDamagePower / 100),
        ownedPosseCount,
        ownedPosseMultiplier,
        multiplier,
      }
    case 'occultResearchMultiplier':
      return {
        title: 'Forbidden Lore Scaling',
        accountLevel: curve.accountLevel,
        baseLabel: 'Occult Research multiplier',
        baseLabelPlacement: 'before',
        baseValue: curve.accountDamagePower / 100,
        ownedPosseCount,
        ownedPosseMultiplier,
        multiplier,
      }
  }
}

export function resolvePublicScaledFormulaValue(
  arg: PublicScaledFormulaDescriptionArg,
  baseValue: number,
): number | null {
  if (!Number.isFinite(baseValue)) {
    return null
  }

  if (arg.formulaKey === 'scaled') {
    const scaledValue =
      typeof arg.multiplier === 'number' && Number.isFinite(arg.multiplier)
        ? baseValue * arg.multiplier
        : baseValue
    const value = arg.rounding === 'ceil' ? Math.ceil(scaledValue) : scaledValue
    return Number.isFinite(value) ? value : null
  }

  const divisor = arg.divisor ?? 1
  if (!Number.isFinite(divisor) || divisor <= 0) {
    return null
  }

  const value = Math.ceil((baseValue * arg.multiplier) / divisor) * arg.postMultiplier
  return Number.isFinite(value) ? value : null
}

export function evaluatePublicFormulaExpression(
  arg: unknown,
  context: PublicFormulaContext = {},
): PublicFormulaEvaluation {
  if (!isPublicComputedDescriptionArg(arg)) {
    return unresolved()
  }

  if (arg.formulaKey === 'scaled' || arg.formulaKey === 'scaledCeilThenMultiply') {
    const base = resolveScaledBaseFormula(arg.baseFormula, context)
    if (!base.resolved || base.value === null) {
      return unresolved()
    }

    const value = resolvePublicScaledFormulaValue(arg, base.value)
    return value === null ? unresolved() : resolved(value)
  }

  if (arg.formulaKey === 'realmMasteryLinear') {
    const resolvedContext = {...buildPublicFormulaContext(), ...context}
    const realmMasteryFinal = resolvedContext.realmMasteryFinal
    if (typeof realmMasteryFinal !== 'number' || !Number.isFinite(realmMasteryFinal)) {
      return unresolved()
    }

    const value = arg.baseValue + realmMasteryFinal * arg.perPoint
    return resolved(arg.rounding === 'ceil' ? Math.ceil(value) : value)
  }

  const wheelRefinementLevel = context.wheelRefinementLevel
  if (typeof wheelRefinementLevel !== 'number' || !Number.isFinite(wheelRefinementLevel)) {
    return unresolved()
  }

  return resolved(arg.baseValue + wheelRefinementLevel * arg.perLevel)
}
