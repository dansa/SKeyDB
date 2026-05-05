import {z} from 'zod'

import {gameplayMathMetadata} from './gameplay-math-metadata'
import {formatWheelEnhanceLevelLabel} from './wheel-enhance'

export const WHEEL_MAINSTAT_KEYS = [
  'CRIT_RATE',
  'CRIT_DMG',
  'REALM_MASTERY',
  'DMG_AMP',
  'ALIEMUS_REGEN',
  'KEYFLARE_REGEN',
  'SIGIL_YIELD',
  'DEATH_RESISTANCE',
] as const

const WHEEL_MAINSTAT_SERIES_RARITY_KEYS = ['SSR', 'SR', 'R', 'N'] as const

export type WheelMainstatKey = (typeof WHEEL_MAINSTAT_KEYS)[number]
export type WheelMainstatSeriesRarity = (typeof WHEEL_MAINSTAT_SERIES_RARITY_KEYS)[number]

export interface WheelMainstatScalingSeries {
  seriesKey: string
  rarity: WheelMainstatSeriesRarity
  mainstatKey: WheelMainstatKey
  baseValue: string
  perLevel: string
}

export interface WheelMainstatScalingSource {
  growthStartLevel: number
  series: WheelMainstatScalingSeries[]
}

const wheelMainstatScalingSeriesSchema = z
  .object({
    seriesKey: z.string().trim().min(1),
    rarity: z.enum(WHEEL_MAINSTAT_SERIES_RARITY_KEYS),
    mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
    baseValue: z.string().trim().min(1),
    perLevel: z.string().trim().min(1),
  })
  .strict()
  .refine(
    (series) => series.seriesKey === buildWheelMainstatSeriesKey(series.rarity, series.mainstatKey),
    {
      message: 'seriesKey must match rarity and mainstatKey',
      path: ['seriesKey'],
    },
  )

const wheelMainstatScalingSourceSchema = z
  .object({
    growthStartLevel: z.number().int().nonnegative(),
    series: z.array(wheelMainstatScalingSeriesSchema).min(1),
  })
  .strict()
  .superRefine((source, context) => {
    const seenSeriesKeys = new Set<string>()
    for (const [index, series] of source.series.entries()) {
      if (seenSeriesKeys.has(series.seriesKey)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate wheel mainstat scaling series "${series.seriesKey}".`,
          path: ['series', index, 'seriesKey'],
        })
      }
      seenSeriesKeys.add(series.seriesKey)
    }
  })

const parsedWheelMainstatScaling: WheelMainstatScalingSource =
  wheelMainstatScalingSourceSchema.parse(gameplayMathMetadata.wheelMainstatScaling)

const wheelMainstatSeriesByKey = new Map(
  parsedWheelMainstatScaling.series.map((series) => [series.seriesKey, series]),
)

interface ParsedWheelMainstatScalar {
  numericValue: number
  suffix: string
}

function parseWheelMainstatScalar(value: string): ParsedWheelMainstatScalar {
  const trimmed = value.trim()
  const match = /^(-?\d+(?:\.\d+)?)(.*)$/.exec(trimmed)
  if (!match) {
    throw new Error(`Invalid wheel mainstat scalar "${value}".`)
  }

  return {
    numericValue: Number(match[1]),
    suffix: match[2],
  }
}

function formatWheelMainstatValue(value: number, suffix: string): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
  return `${formatted}${suffix}`
}

function formatSignedWheelMainstatValue(value: number, suffix: string): string {
  return `${value >= 0 ? '+' : ''}${formatWheelMainstatValue(value, suffix)}`
}

export function getWheelMainstatScaling(): WheelMainstatScalingSource {
  return parsedWheelMainstatScaling
}

export function getWheelMainstatSeries(seriesKey: string): WheelMainstatScalingSeries | undefined {
  return wheelMainstatSeriesByKey.get(seriesKey)
}

export function buildWheelMainstatSeriesKey(
  rarity: WheelMainstatSeriesRarity,
  mainstatKey: WheelMainstatKey,
): string {
  return `${rarity}:${mainstatKey}`
}

export function resolveWheelMainstatValue(
  seriesOrKey: string | WheelMainstatScalingSeries,
  enhanceLevel: number,
): string {
  const series = typeof seriesOrKey === 'string' ? getWheelMainstatSeries(seriesOrKey) : seriesOrKey
  if (!series) {
    throw new Error(
      `Unknown wheel mainstat scaling series "${
        typeof seriesOrKey === 'string' ? seriesOrKey : seriesOrKey.seriesKey
      }".`,
    )
  }

  const baseValue = parseWheelMainstatScalar(series.baseValue)
  const perLevel = parseWheelMainstatScalar(series.perLevel)
  if (baseValue.suffix !== perLevel.suffix) {
    throw new Error(`Mismatched wheel mainstat suffixes for "${series.seriesKey}".`)
  }

  const normalizedLevel = Math.max(0, Math.floor(enhanceLevel))
  const growthSteps = Math.max(0, normalizedLevel - parsedWheelMainstatScaling.growthStartLevel + 1)

  return formatWheelMainstatValue(
    baseValue.numericValue + perLevel.numericValue * growthSteps,
    baseValue.suffix,
  )
}

export function buildWheelMainstatHover(
  seriesOrKey: string | WheelMainstatScalingSeries,
  enhanceLevel: number,
): string {
  const series = typeof seriesOrKey === 'string' ? getWheelMainstatSeries(seriesOrKey) : seriesOrKey
  if (!series) {
    throw new Error(
      `Unknown wheel mainstat scaling series "${
        typeof seriesOrKey === 'string' ? seriesOrKey : seriesOrKey.seriesKey
      }".`,
    )
  }

  const baseValue = parseWheelMainstatScalar(series.baseValue)
  const perLevel = parseWheelMainstatScalar(series.perLevel)
  if (baseValue.suffix !== perLevel.suffix) {
    throw new Error(`Mismatched wheel mainstat suffixes for "${series.seriesKey}".`)
  }

  const normalizedLevel = Math.max(0, Math.floor(enhanceLevel))
  const growthSteps = Math.max(0, normalizedLevel - parsedWheelMainstatScaling.growthStartLevel + 1)
  const growthStartsAfter = formatWheelEnhanceLevelLabel(
    Math.max(0, parsedWheelMainstatScaling.growthStartLevel - 1),
  )
  const currentEnhance = formatWheelEnhanceLevelLabel(normalizedLevel)
  const resolvedValue = resolveWheelMainstatValue(series, normalizedLevel)

  return [
    'Wheel Main Stat',
    `Base value: ${series.baseValue}`,
    `Enhance growth: ${formatSignedWheelMainstatValue(
      perLevel.numericValue,
      perLevel.suffix,
    )} per level after ${growthStartsAfter}`,
    `Current Enhance: ${currentEnhance}`,
    '',
    `${series.baseValue} + (${String(growthSteps)} × ${series.perLevel}) = ${resolvedValue}`,
  ].join('\n')
}
