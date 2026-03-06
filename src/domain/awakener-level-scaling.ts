import { fmtNum } from './scaling'
import type {
  AwakenerFull,
  AwakenerFullStats,
  AwakenerPrimaryScalingBase,
  AwakenerSubstatScaling,
  AwakenerSubstatScalingKey,
} from './awakeners-full'

const DATABASE_MIN_LEVEL = 1
const DATABASE_DEFAULT_LEVEL = 60
const DATABASE_MAX_LEVEL = 90
const DATABASE_MIN_PSYCHE_SURGE_OFFSET = 0
const DATABASE_MAX_PSYCHE_SURGE_OFFSET = 12
const SUBSTAT_SCALING_CAP_LEVEL = 60
const SUBSTAT_SCALING_STEP_LEVEL = 10
const SUBSTAT_SCALING_MAX_STEPS = SUBSTAT_SCALING_CAP_LEVEL / SUBSTAT_SCALING_STEP_LEVEL
const PRIMARY_STAT_KEYS = ['CON', 'ATK', 'DEF'] as const
const PRIMARY_STAT_FORMULA_EPSILON = 1e-9

type ParsedStatValue = {
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
  awakener: Pick<AwakenerFull, 'stats' | 'primaryScalingBase' | 'statScaling' | 'substatScaling'>,
  level: number,
  psycheSurgeOffset = 0,
): AwakenerFullStats {
  const clampedLevel = clampAwakenerDatabaseLevel(level)
  const clampedPsycheSurgeOffset = clampAwakenerDatabasePsycheSurgeOffset(psycheSurgeOffset)
  const nextStats = { ...awakener.stats }

  for (const key of PRIMARY_STAT_KEYS) {
    nextStats[key] = resolvePrimaryStatValue(
      awakener.stats[key],
      awakener.primaryScalingBase,
      awakener.statScaling[key],
      clampedLevel,
    )
  }

  for (const [key, growth] of Object.entries(awakener.substatScaling)) {
    if (!growth) {
      continue
    }
    const statKey = key as AwakenerSubstatScalingKey
    nextStats[statKey] = resolveSubstatValue(
      awakener.stats[statKey],
      growth,
      clampedLevel,
      clampedPsycheSurgeOffset,
    )
  }

  return nextStats
}

export function hasAwakenerSubstatScaling(substatScaling: AwakenerSubstatScaling | null | undefined): boolean {
  if (!substatScaling) {
    return false
  }
  return Object.values(substatScaling).some((value) => Boolean(value))
}

function resolvePrimaryStatValue(
  baseValue: string,
  scalingBase: AwakenerPrimaryScalingBase | undefined,
  growthPerLevel: number,
  level: number,
): string {
  if (scalingBase === undefined || Number.isNaN(Number(baseValue)) || !Number.isFinite(growthPerLevel)) {
    return baseValue
  }
  const nextValue = Math.ceil((scalingBase + level) * growthPerLevel - PRIMARY_STAT_FORMULA_EPSILON)
  return String(nextValue)
}

function resolveSubstatValue(baseValue: string, growthPerTenLevels: string, level: number, psycheSurgeOffset: number): string {
  const parsedBase = parseStatValue(baseValue)
  const parsedGrowth = parseStatValue(growthPerTenLevels)
  if (!parsedBase || !parsedGrowth) {
    return baseValue
  }

  const appliedSteps = getAppliedSubstatScalingSteps(level)
  const missingStepsFromLevel60 = SUBSTAT_SCALING_MAX_STEPS - appliedSteps
  const nextValue =
    parsedBase.value - missingStepsFromLevel60 * parsedGrowth.value + psycheSurgeOffset * parsedGrowth.value
  return formatStatValue(nextValue, parsedBase.suffix || parsedGrowth.suffix)
}

function getAppliedSubstatScalingSteps(level: number): number {
  return Math.min(Math.floor(clampAwakenerDatabaseLevel(level) / SUBSTAT_SCALING_STEP_LEVEL), SUBSTAT_SCALING_MAX_STEPS)
}

function parseStatValue(rawValue: string): ParsedStatValue | null {
  const match = rawValue.trim().match(/^(-?\d+(?:\.\d+)?)(%)?$/)
  if (!match) {
    return null
  }
  return {
    value: Number(match[1]),
    suffix: match[2] ?? '',
  }
}

function formatStatValue(value: number, suffix: string): string {
  const normalizedValue = Math.abs(value) < 0.0001 ? 0 : value
  const roundedValue = Math.round(normalizedValue * 10) / 10
  return `${fmtNum(roundedValue)}${suffix}`
}
