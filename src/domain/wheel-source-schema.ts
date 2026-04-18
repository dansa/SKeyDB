import {z} from 'zod'

import {describedRecordSchema} from './awakener-source-schema.ts'

const nonEmptyStringSchema = z.string().trim().min(1)

function addDuplicateStringFieldIssue<T extends Record<string, unknown>>(
  records: T[],
  field: keyof T,
  label: string,
  ctx: z.RefinementCtx,
) {
  const firstIndexByValue = new Map<string, number>()

  for (const [index, record] of records.entries()) {
    const rawValue = record[field]
    if (typeof rawValue !== 'string') {
      continue
    }

    const value = rawValue.trim()
    if (!value) {
      continue
    }

    const firstIndex = firstIndexByValue.get(value)
    if (firstIndex !== undefined) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate ${label} "${value}" at indexes ${String(firstIndex)} and ${String(index)}.`,
        path: [index, String(field)],
      })
      continue
    }

    firstIndexByValue.set(value, index)
  }
}

export const WHEEL_SOURCE_RARITY_KEYS = ['SSR', 'SR', 'R'] as const
export const WHEEL_MAINSTAT_SERIES_RARITY_KEYS = ['SSR', 'SR', 'R', 'N'] as const
export const WHEEL_REALM_KEYS = ['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL'] as const
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

export const wheelSourceRecordSchema = describedRecordSchema.extend({
  id: nonEmptyStringSchema,
  assetId: nonEmptyStringSchema,
  rarity: z.enum(WHEEL_SOURCE_RARITY_KEYS),
  realm: z.enum(WHEEL_REALM_KEYS),
  mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
  name: nonEmptyStringSchema,
  ownerAwakenerId: z.number().int().positive().optional(),
})

export const wheelSourceDatasetSchema = z
  .array(wheelSourceRecordSchema)
  .superRefine((records, ctx) => {
    addDuplicateStringFieldIssue(records, 'id', 'wheel id', ctx)
  })

export const wheelMainstatScalingSeriesSchema = z.object({
  seriesKey: nonEmptyStringSchema,
  rarity: z.enum(WHEEL_MAINSTAT_SERIES_RARITY_KEYS),
  mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
  baseValue: nonEmptyStringSchema,
  perLevel: nonEmptyStringSchema,
})

export const wheelMainstatScalingSourceSchema = z
  .object({
    growthStartLevel: z.number().int().positive(),
    series: z.array(wheelMainstatScalingSeriesSchema),
  })
  .superRefine((source, ctx) => {
    addDuplicateStringFieldIssue(source.series, 'seriesKey', 'wheel mainstat series key', ctx)
  })

export type WheelMainstatScalingSeries = z.infer<typeof wheelMainstatScalingSeriesSchema>
export type WheelMainstatScalingSource = z.infer<typeof wheelMainstatScalingSourceSchema>
export type WheelSourceRecord = z.infer<typeof wheelSourceRecordSchema>
