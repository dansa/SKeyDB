import {z} from 'zod'

import {type AwakenerOverlayRecord} from './awakener-source-schema.ts'
import {
  WHEEL_MAINSTAT_KEYS,
  WHEEL_REALM_KEYS,
  WHEEL_SOURCE_RARITY_KEYS,
} from './wheel-source-schema.ts'
import {type WheelFullV1Record} from './wheels-full-v1-compiler.ts'

const nonEmptyStringSchema = z.string().trim().min(1)

export const wheelsLiteV1RecordSchema = z.object({
  id: nonEmptyStringSchema,
  assetId: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  rarity: z.enum(WHEEL_SOURCE_RARITY_KEYS),
  realm: z.enum(WHEEL_REALM_KEYS),
  awakener: z.string(),
  ownerAwakenerId: z.number().int().positive().optional(),
  ownerAwakenerName: nonEmptyStringSchema.optional(),
  aliases: z.array(nonEmptyStringSchema),
  tags: z.array(nonEmptyStringSchema),
  mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
})

export const wheelsLiteV1DatasetSchema = z.array(wheelsLiteV1RecordSchema)

export type WheelLiteV1Record = z.infer<typeof wheelsLiteV1RecordSchema>

const DESCRIPTION_REFERENCE_PATTERN = /\{([^}]+)\}/g

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function extractDescriptionReferences(descriptionTemplate: string): string[] {
  const matches = descriptionTemplate.matchAll(DESCRIPTION_REFERENCE_PATTERN)
  return Array.from(new Set(Array.from(matches, (match) => match[1].trim()).filter(Boolean)))
}

function buildOverlayLookup(
  overlayRecords: AwakenerOverlayRecord[],
): Map<string, AwakenerOverlayRecord> {
  const byName = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlayRecords) {
    byName.set(normalize(overlay.displayName), overlay)
    for (const alias of overlay.aliases) {
      byName.set(normalize(alias), overlay)
    }
  }

  return byName
}

function inferOverlayTags(
  record: WheelFullV1Record,
  overlayLookup: Map<string, AwakenerOverlayRecord>,
): string[] {
  const inferredTags = new Set<string>()

  for (const reference of extractDescriptionReferences(record.descriptionTemplate)) {
    const overlay = overlayLookup.get(normalize(reference))
    if (!overlay) {
      continue
    }

    inferredTags.add(overlay.displayName)
  }

  return Array.from(inferredTags)
}

interface CompileWheelsLiteV1Input {
  fullRecords: WheelFullV1Record[]
  overlayRecords: AwakenerOverlayRecord[]
}

export function compileWheelsLiteV1({
  fullRecords,
  overlayRecords,
}: CompileWheelsLiteV1Input): WheelLiteV1Record[] {
  const overlayLookup = buildOverlayLookup(overlayRecords)

  return wheelsLiteV1DatasetSchema.parse(
    fullRecords.map((record) => ({
      id: record.id,
      assetId: record.assetId,
      name: record.name,
      rarity: record.rarity,
      realm: record.realm,
      awakener: record.awakener ?? '',
      ownerAwakenerId: record.ownerAwakenerId,
      ownerAwakenerName: record.ownerAwakenerName,
      aliases: record.aliases,
      tags: Array.from(
        new Set([...record.searchTags, ...inferOverlayTags(record, overlayLookup)]),
      ).sort((left, right) => left.localeCompare(right)),
      mainstatKey: record.mainstatKey,
    })),
  )
}
