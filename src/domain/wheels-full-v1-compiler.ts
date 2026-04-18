import {z} from 'zod'

import {awakenerRosterSchema, descriptionArgsSchema} from './awakener-source-schema.ts'
import {buildWheelMainstatSeriesKey} from './wheel-mainstat-scaling.ts'
import {
  WHEEL_MAINSTAT_KEYS,
  WHEEL_REALM_KEYS,
  WHEEL_SOURCE_RARITY_KEYS,
  wheelMainstatScalingSourceSchema,
  type WheelMainstatScalingSource,
  type WheelSourceRecord,
} from './wheel-source-schema.ts'

const nonEmptyStringSchema = z.string().trim().min(1)

export const wheelFullV1RecordSchema = z.object({
  id: nonEmptyStringSchema,
  assetId: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  rarity: z.enum(WHEEL_SOURCE_RARITY_KEYS),
  realm: z.enum(WHEEL_REALM_KEYS),
  awakener: nonEmptyStringSchema.optional(),
  ownerAwakenerId: z.number().int().positive().optional(),
  ownerAwakenerName: nonEmptyStringSchema.optional(),
  aliases: z.array(nonEmptyStringSchema),
  searchTags: z.array(nonEmptyStringSchema),
  mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
  mainstatSeriesKey: nonEmptyStringSchema,
  descriptionTemplate: nonEmptyStringSchema,
  descriptionArgs: descriptionArgsSchema,
})

export const wheelsFullV1DatasetSchema = z.array(wheelFullV1RecordSchema)

export type WheelFullV1Record = z.infer<typeof wheelFullV1RecordSchema>

interface CompileWheelsFullV1Input {
  sourceRecords: WheelSourceRecord[]
  awakeners: z.infer<typeof awakenerRosterSchema>[]
  mainstatScaling: WheelMainstatScalingSource
}

function resolveWheelMainstatSeriesKey(
  record: WheelSourceRecord,
  mainstatSeriesKeys: Set<string>,
): string {
  const explicitSeriesKey =
    record.id.startsWith('N') &&
    mainstatSeriesKeys.has(buildWheelMainstatSeriesKey('N', record.mainstatKey))
      ? buildWheelMainstatSeriesKey('N', record.mainstatKey)
      : buildWheelMainstatSeriesKey(record.rarity, record.mainstatKey)

  if (!mainstatSeriesKeys.has(explicitSeriesKey)) {
    throw new Error(
      `Missing wheel mainstat scaling series "${explicitSeriesKey}" for wheel "${record.id}".`,
    )
  }

  return explicitSeriesKey
}

export function compileWheelsFullV1({
  sourceRecords,
  awakeners,
  mainstatScaling,
}: CompileWheelsFullV1Input): WheelFullV1Record[] {
  const parsedMainstatScaling = wheelMainstatScalingSourceSchema.parse(mainstatScaling)

  const awakenerById = new Map(awakeners.map((awakener) => [awakener.id, awakener]))
  const mainstatSeriesKeys = new Set(parsedMainstatScaling.series.map((series) => series.seriesKey))

  const compiled = sourceRecords.map((record) => {
    const owner = record.ownerAwakenerId ? awakenerById.get(record.ownerAwakenerId) : undefined
    if (record.ownerAwakenerId && !owner) {
      throw new Error(
        `Missing owner awakener ${String(record.ownerAwakenerId)} for wheel "${record.id}".`,
      )
    }

    return {
      id: record.id,
      assetId: record.assetId,
      name: record.name,
      rarity: record.rarity,
      realm: record.realm,
      ...(owner ? {awakener: owner.displayName, ownerAwakenerName: owner.displayName} : {}),
      ...(record.ownerAwakenerId ? {ownerAwakenerId: record.ownerAwakenerId} : {}),
      aliases: [record.name],
      searchTags: [],
      mainstatKey: record.mainstatKey,
      mainstatSeriesKey: resolveWheelMainstatSeriesKey(record, mainstatSeriesKeys),
      descriptionTemplate: record.descriptionTemplate,
      descriptionArgs: record.descriptionArgs,
    }
  })

  return wheelsFullV1DatasetSchema.parse(compiled)
}
