import {z} from 'zod'

import {getPublicGameplayMathMetadata} from '@/data-access/public-data/gameplayMetadataRepository'

const nonEmptyStringSchema = z.string().trim().min(1)

const accountLevelCurveSchema = z
  .strictObject({
    minLevel: z.number().int().positive(),
    maxLevel: z.number().int().positive(),
    stageGrow: z.array(z.number()),
    accountDamagePower: z.array(z.number()),
    hpMultiplier: z.array(z.number()),
  })
  .superRefine((curve, context) => {
    if (curve.maxLevel < curve.minLevel) {
      context.addIssue({
        code: 'custom',
        message: 'maxLevel must be greater than or equal to minLevel.',
        path: ['maxLevel'],
      })
      return
    }

    const expectedLength = curve.maxLevel - curve.minLevel + 1
    for (const field of ['stageGrow', 'accountDamagePower', 'hpMultiplier'] as const) {
      if (curve[field].length !== expectedLength) {
        context.addIssue({
          code: 'custom',
          message: `${field} length must match the account level range.`,
          path: [field],
        })
      }
    }
  })

const wheelMainstatScalingSeriesSchema = z
  .strictObject({
    seriesKey: nonEmptyStringSchema,
    rarity: nonEmptyStringSchema,
    mainstatKey: nonEmptyStringSchema,
    baseValue: nonEmptyStringSchema,
    perLevel: nonEmptyStringSchema,
  })
  .refine((series) => series.seriesKey === `${series.rarity}:${series.mainstatKey}`, {
    message: 'seriesKey must match rarity and mainstatKey',
    path: ['seriesKey'],
  })

const wheelMainstatScalingSchema = z
  .strictObject({
    growthStartLevel: z.number().int().nonnegative(),
    series: z.array(wheelMainstatScalingSeriesSchema).min(1),
  })
  .superRefine((source, context) => {
    const seenSeriesKeys = new Set<string>()
    source.series.forEach((series, index) => {
      if (seenSeriesKeys.has(series.seriesKey)) {
        context.addIssue({
          code: 'custom',
          message: `Duplicate wheel mainstat scaling series "${series.seriesKey}".`,
          path: ['series', index, 'seriesKey'],
        })
      }
      seenSeriesKeys.add(series.seriesKey)
    })
  })

const gameplayMathMetadataSchema = z.strictObject({
  schemaVersion: z.union([z.literal(1), z.literal(3)]),
  accountLevelCurve: accountLevelCurveSchema,
  wheelMainstatScaling: wheelMainstatScalingSchema,
  formulas: z.record(z.string(), z.unknown()),
})

export const gameplayMathMetadata = gameplayMathMetadataSchema.parse(
  getPublicGameplayMathMetadata(),
)

export type GameplayMathMetadata = typeof gameplayMathMetadata
export type WheelMainstatScalingMetadata = GameplayMathMetadata['wheelMainstatScaling']
export type WheelMainstatScalingSeriesMetadata = WheelMainstatScalingMetadata['series'][number]

export interface AccountLevelCurveEntry {
  accountLevel: number
  stageGrow: number
  accountDamagePower: number
  hpMultiplier: number
}

export function clampAccountLevel(accountLevel: number | null | undefined): number {
  const {minLevel, maxLevel} = gameplayMathMetadata.accountLevelCurve
  if (typeof accountLevel !== 'number' || !Number.isFinite(accountLevel)) {
    return maxLevel
  }

  return Math.max(minLevel, Math.min(maxLevel, Math.floor(accountLevel)))
}

export function resolveAccountLevelCurveEntry(
  accountLevel: number | null | undefined,
): AccountLevelCurveEntry {
  const curve = gameplayMathMetadata.accountLevelCurve
  const clampedLevel = clampAccountLevel(accountLevel)
  const index = clampedLevel - curve.minLevel

  return {
    accountLevel: clampedLevel,
    stageGrow: curve.stageGrow[index],
    accountDamagePower: curve.accountDamagePower[index],
    hpMultiplier: curve.hpMultiplier[index],
  }
}
