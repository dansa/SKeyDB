import type {
  FullStats,
  PrimaryScalingBase,
  SubstatScaling,
  SubstatScalingKey,
} from './awakener-source-schema'
import {fmtNum} from './scaling'

const DATABASE_MIN_LEVEL = 1
const DATABASE_DEFAULT_LEVEL = 60
const DATABASE_MAX_LEVEL = 90
const DATABASE_MIN_PSYCHE_SURGE_OFFSET = 0
const DATABASE_MAX_PSYCHE_SURGE_OFFSET = 12
const SUBSTAT_SCALING_CAP_LEVEL = 60
const SUBSTAT_SCALING_STEP_LEVEL = 10
const SUBSTAT_SCALING_MAX_STEPS = SUBSTAT_SCALING_CAP_LEVEL / SUBSTAT_SCALING_STEP_LEVEL
const PRIMARY_STAT_KEYS = ['CON', 'ATK', 'DEF'] as const
type PrimaryStatKey = (typeof PRIMARY_STAT_KEYS)[number]
const PRIMARY_STAT_FORMULA_EPSILON = 1e-9

interface ParsedStatValue {
  value: number
  suffix: string
}

export function clampAwakenerDatabaseLevel(level: number): number {
  const normalized = Number.isFinite(level) ? Math.round(level) : DATABASE_DEFAULT_LEVEL
  if (normalized < DATABASE_MIN_LEVEL) {
    return DATABASE_MIN_LEVEL
  }
  if (normalized > DATABASE_MAX_LEVEL) {
    return DATABASE_MAX_LEVEL
  }
  return normalized
}

export function clampAwakenerDatabasePsycheSurgeOffset(offset: number): number {
  const normalized = Number.isFinite(offset) ? Math.round(offset) : DATABASE_MIN_PSYCHE_SURGE_OFFSET
  if (normalized < DATABASE_MIN_PSYCHE_SURGE_OFFSET) {
    return DATABASE_MIN_PSYCHE_SURGE_OFFSET
  }
  if (normalized > DATABASE_MAX_PSYCHE_SURGE_OFFSET) {
    return DATABASE_MAX_PSYCHE_SURGE_OFFSET
  }
  return normalized
}

export function resolveAwakenerStatsForLevel(
  awakener: Pick<
    {
      stats: FullStats
      primaryScalingBase?: PrimaryScalingBase
      statScaling: Record<'CON' | 'ATK' | 'DEF', number>
      substatScaling: SubstatScaling
    },
    'stats' | 'primaryScalingBase' | 'statScaling' | 'substatScaling'
  >,
  level: number,
  psycheSurgeOffset = 0,
  soulforgePrimaryStatBonusPercent = 0,
  gnosticPrimaryStatBonusLevels: Partial<Record<PrimaryStatKey, number>> = {},
): FullStats {
  const clampedLevel = clampAwakenerDatabaseLevel(level)
  const clampedPsycheSurgeOffset = clampAwakenerDatabasePsycheSurgeOffset(psycheSurgeOffset)
  const nextStats = {...awakener.stats}

  for (const key of PRIMARY_STAT_KEYS) {
    const scaledPrimaryStat = resolvePrimaryStatValue(
      awakener.stats[key],
      awakener.primaryScalingBase,
      awakener.statScaling[key],
      clampedLevel,
      gnosticPrimaryStatBonusLevels[key] ?? 0,
    )
    nextStats[key] = applyPrimaryStatBonus(scaledPrimaryStat, soulforgePrimaryStatBonusPercent)
  }

  for (const [key, growth] of Object.entries(awakener.substatScaling)) {
    if (!growth) {
      continue
    }
    const statKey = key as SubstatScalingKey
    nextStats[statKey] = resolveSubstatValue(
      awakener.stats[statKey],
      growth,
      clampedLevel,
      clampedPsycheSurgeOffset,
    )
  }

  return nextStats
}

function applyPrimaryStatBonus(baseValue: string, bonusPercent: number): string {
  if (!bonusPercent) {
    return baseValue
  }

  const parsedBase = parseStatValue(baseValue)
  if (!parsedBase) {
    return baseValue
  }

  return formatStatValue(
    Math.ceil(parsedBase.value * (1 + bonusPercent / 100) - 1e-9),
    parsedBase.suffix,
  )
}

export function hasAwakenerSubstatScaling(
  substatScaling: SubstatScaling | null | undefined,
): boolean {
  if (!substatScaling) {
    return false
  }
  return Object.values(substatScaling).some((value) => Boolean(value))
}

function resolvePrimaryStatValue(
  baseValue: string,
  scalingBase: PrimaryScalingBase | undefined,
  growthPerLevel: number,
  level: number,
  bonusLevels: number,
): string {
  if (
    scalingBase === undefined ||
    Number.isNaN(Number(baseValue)) ||
    !Number.isFinite(growthPerLevel)
  ) {
    return baseValue
  }
  const nextValue = Math.ceil(
    (scalingBase + level + bonusLevels) * growthPerLevel - PRIMARY_STAT_FORMULA_EPSILON,
  )
  return String(nextValue)
}

function resolveSubstatValue(
  baseValue: string,
  growthPerTenLevels: string,
  level: number,
  psycheSurgeOffset: number,
): string {
  const parsedBase = parseStatValue(baseValue)
  const parsedGrowth = parseStatValue(growthPerTenLevels)
  if (!parsedBase || !parsedGrowth) {
    return baseValue
  }

  const appliedSteps = getAppliedSubstatScalingSteps(level)
  const missingStepsFromLevel60 = SUBSTAT_SCALING_MAX_STEPS - appliedSteps
  const nextValue =
    parsedBase.value -
    missingStepsFromLevel60 * parsedGrowth.value +
    psycheSurgeOffset * parsedGrowth.value
  return formatStatValue(nextValue, parsedBase.suffix || parsedGrowth.suffix)
}

function getAppliedSubstatScalingSteps(level: number): number {
  return Math.min(
    Math.floor(clampAwakenerDatabaseLevel(level) / SUBSTAT_SCALING_STEP_LEVEL),
    SUBSTAT_SCALING_MAX_STEPS,
  )
}

function parseStatValue(rawValue: string): ParsedStatValue | null {
  const regex = /^(-?\d+(?:\.\d+)?)(%)?$/
  const match = regex.exec(rawValue.trim())
  if (!match) {
    return null
  }
  const [, numericValue, suffix = ''] = match
  return {
    value: Number(numericValue),
    suffix,
  }
}

function formatStatValue(value: number, suffix: string): string {
  const normalizedValue = Math.abs(value) < 0.0001 ? 0 : value
  const roundedValue = Math.round(normalizedValue * 10) / 10
  return `${fmtNum(roundedValue)}${suffix}`
}
