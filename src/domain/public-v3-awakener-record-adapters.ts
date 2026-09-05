import {z} from 'zod'

import {resolvePublicAsset} from '@/data-access/public-data/assetRepository'
import type {PublicRecord} from '@/data-access/public-data/contract'

import {
  awakenerOverlaySchema,
  awakenersEnlightenSchema,
  awakenerSkillSchema,
  awakenerTalentSchema,
  cardKeywordsSchema,
  derivedSkillSchema,
  descriptionArgsSchema,
  orisonApplicationSchema,
  type AwakenerEnlightenRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type CardKeyword,
  type DerivedSkillRecord,
  type DescriptionArg,
  type OrisonApplicationRecord,
} from './awakener-source-schema'
import type {PublicUpgradeableOverlayRecord} from './awakeners-full'

const publicV3AwakenerSkillSchema = awakenerSkillSchema.loose()
const publicV3AwakenerTalentSchema = awakenerTalentSchema.loose()
const publicV3AwakenerEnlightenSchema = awakenersEnlightenSchema.loose()
const publicV3DerivedSkillSchema = derivedSkillSchema.loose()
const publicV3AwakenerOverlaySchema = awakenerOverlaySchema.loose()
const publicRouteInfoSchema = z.looseObject({
  slug: z.string(),
  canonicalPath: z.string(),
})
const publicAssetsSchema = z.record(z.string(), z.string())
const publicV3UpgradeEntrySchema = z.looseObject({
  id: z.string().optional(),
  upgraderId: z.string().optional(),
  upgraderType: z.string().optional(),
  upgraderSlot: z.string().optional(),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
  operation: z.string().optional(),
  patch: z.record(z.string(), z.unknown()).optional(),
})
export type PublicV3UpgradeEntry = z.infer<typeof publicV3UpgradeEntrySchema>
const publicV3OwnedRecordBaseShape = {
  id: z.string(),
  name: z.string(),
  route: publicRouteInfoSchema.optional(),
  assets: publicAssetsSchema.optional(),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
}

const publicV3OwnedRecordShape = {
  ...publicV3OwnedRecordBaseShape,
  schemaVersion: z.literal(3),
}
const publicV3OwnedCatalogRecordShape = {
  ...publicV3OwnedRecordBaseShape,
  schemaVersion: z.literal(3).optional(),
}

export interface PublicV3OwnedRecord {
  schemaVersion?: 3
  kind: PublicRecord['kind']
  id: string
  name: string
  route?: PublicRecord['route']
  assets?: PublicRecord['assets']
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  [key: string]: unknown
}

export type PublicV3SkillRecord = PublicV3OwnedRecord & {
  lore?: string
  cardFamily?: string
  cardKeywords?: CardKeyword[]
  cardTypes?: string[]
  countsAs?: string[]
  descriptionArgs?: Record<string, DescriptionArg>
  descriptionTemplate?: string
  slot?: string
  upgrades?: PublicV3UpgradeEntry[]
  orisonIds?: string[]
  orisonApplications?: OrisonApplicationRecord[]
}

export type PublicV3TalentRecord = PublicV3OwnedRecord & {
  descriptionArgs?: Record<string, DescriptionArg>
  descriptionTemplate?: string
  family?: string
  maxLevel?: number
  defaultMaxed?: boolean
}

export type PublicV3EnlightenRecord = PublicV3OwnedRecord & {
  descriptionArgs?: Record<string, DescriptionArg>
  descriptionTemplate?: string
  slot?: string
}

export type PublicV3DerivedSkillRecord = PublicV3OwnedRecord & {
  lore?: string
  cardFamily?: string
  cardKeywords?: CardKeyword[]
  cardTypes?: string[]
  childDerivedSkillIds?: string[]
  childPosseIds?: string[]
  descriptionArgs?: Record<string, DescriptionArg>
  descriptionTemplate?: string
  countsAs?: string[]
  upgrades?: PublicV3UpgradeEntry[]
}

export type PublicV3OverlayRecord = PublicV3OwnedRecord & {
  aliases?: string[]
  descriptionArgs?: Record<string, DescriptionArg>
  descriptionTemplate?: string
  iconId?: string
  overlayType?: string
  upgrades?: PublicV3UpgradeEntry[]
}

const publicV3SkillRecordShape = {
  lore: z.string().optional(),
  kind: z.literal('skill'),
  cardFamily: z.string().trim().min(1).optional(),
  cardKeywords: cardKeywordsSchema.optional(),
  cardTypes: z.array(z.string().trim().min(1)).optional(),
  countsAs: z.array(z.string().trim().min(1)).optional(),
  descriptionArgs: descriptionArgsSchema.optional(),
  descriptionTemplate: z.string().optional(),
  slot: z.string().optional(),
  upgrades: z.array(publicV3UpgradeEntrySchema).optional(),
  orisonIds: z.array(z.string()).optional(),
  orisonApplications: z.array(orisonApplicationSchema).optional(),
}
const publicV3TalentRecordShape = {
  kind: z.literal('talent'),
  descriptionArgs: descriptionArgsSchema.optional(),
  descriptionTemplate: z.string().optional(),
  family: z.string().optional(),
  maxLevel: z.number().optional(),
  defaultMaxed: z.boolean().optional(),
}
const publicV3EnlightenRecordShape = {
  kind: z.literal('enlighten'),
  descriptionArgs: descriptionArgsSchema.optional(),
  descriptionTemplate: z.string().optional(),
  slot: z.string().optional(),
}
const publicV3DerivedSkillRecordShape = {
  lore: z.string().optional(),
  kind: z.literal('derivedSkill'),
  cardFamily: z.string().trim().min(1).optional(),
  cardKeywords: cardKeywordsSchema.optional(),
  cardTypes: z.array(z.string().trim().min(1)).optional(),
  childDerivedSkillIds: z.array(z.string()).optional(),
  childPosseIds: z.array(z.string()).optional(),
  descriptionArgs: descriptionArgsSchema.optional(),
  descriptionTemplate: z.string().optional(),
  countsAs: z.array(z.string().trim().min(1)).optional(),
  upgrades: z.array(publicV3UpgradeEntrySchema).optional(),
}
const publicV3OverlayRecordShape = {
  kind: z.literal('overlay'),
  aliases: z.array(z.string()).optional(),
  descriptionArgs: descriptionArgsSchema.optional(),
  descriptionTemplate: z.string().optional(),
  iconId: z.string().optional(),
  overlayType: z.string().optional(),
  upgrades: z.array(publicV3UpgradeEntrySchema).optional(),
}

const publicV3SkillRecordSchema: z.ZodType<PublicV3SkillRecord> = z.looseObject({
  ...publicV3OwnedRecordShape,
  ...publicV3SkillRecordShape,
})
const publicV3SkillCatalogRecordSchema: z.ZodType<PublicV3SkillRecord> = z.looseObject({
  ...publicV3OwnedCatalogRecordShape,
  ...publicV3SkillRecordShape,
})
const publicV3TalentRecordSchema: z.ZodType<PublicV3TalentRecord> = z.looseObject({
  ...publicV3OwnedRecordShape,
  ...publicV3TalentRecordShape,
})
const publicV3TalentCatalogRecordSchema: z.ZodType<PublicV3TalentRecord> = z.looseObject({
  ...publicV3OwnedCatalogRecordShape,
  ...publicV3TalentRecordShape,
})
const publicV3EnlightenRecordSchema: z.ZodType<PublicV3EnlightenRecord> = z.looseObject({
  ...publicV3OwnedRecordShape,
  ...publicV3EnlightenRecordShape,
})
const publicV3EnlightenCatalogRecordSchema: z.ZodType<PublicV3EnlightenRecord> = z.looseObject({
  ...publicV3OwnedCatalogRecordShape,
  ...publicV3EnlightenRecordShape,
})
const publicV3DerivedSkillRecordSchema: z.ZodType<PublicV3DerivedSkillRecord> = z.looseObject({
  ...publicV3OwnedRecordShape,
  ...publicV3DerivedSkillRecordShape,
})
const publicV3DerivedSkillCatalogRecordSchema: z.ZodType<PublicV3DerivedSkillRecord> =
  z.looseObject({
    ...publicV3OwnedCatalogRecordShape,
    ...publicV3DerivedSkillRecordShape,
  })
const publicV3OverlayRecordSchema: z.ZodType<PublicV3OverlayRecord> = z.looseObject({
  ...publicV3OwnedRecordShape,
  ...publicV3OverlayRecordShape,
})
const publicV3OverlayCatalogRecordSchema: z.ZodType<PublicV3OverlayRecord> = z.looseObject({
  ...publicV3OwnedCatalogRecordShape,
  ...publicV3OverlayRecordShape,
})

export function numericAwakenerId(publicAwakenerId: string): number {
  return Number(/^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1] ?? 0)
}

export function optionalNumericAwakenerId(
  publicAwakenerId: string | undefined,
): number | undefined {
  return publicAwakenerId ? numericAwakenerId(publicAwakenerId) : undefined
}

export function skillKindFromPublicSlot(slot: string | undefined): AwakenerSkillRecord['kind'] {
  switch (slot) {
    case 'Rouse':
      return 'rouse'
    case 'Strike':
      return 'strike'
    case 'Defense':
      return 'defense'
    case 'Skill1':
    case 'Skill2':
      return 'command'
    case 'Exalt':
      return 'exalt'
    case 'OverExalt':
      return 'over_exalt'
    default:
      return 'other'
  }
}

export function parsePublicV3SkillRecord(value: unknown): PublicV3SkillRecord {
  return publicV3SkillRecordSchema.parse(value)
}

export function parsePublicV3SkillCatalogRecord(value: unknown): PublicV3SkillRecord {
  return publicV3SkillCatalogRecordSchema.parse(value)
}

export function parsePublicV3TalentRecord(value: unknown): PublicV3TalentRecord {
  return publicV3TalentRecordSchema.parse(value)
}

export function parsePublicV3TalentCatalogRecord(value: unknown): PublicV3TalentRecord {
  return publicV3TalentCatalogRecordSchema.parse(value)
}

export function parsePublicV3EnlightenRecord(value: unknown): PublicV3EnlightenRecord {
  return publicV3EnlightenRecordSchema.parse(value)
}

export function parsePublicV3EnlightenCatalogRecord(value: unknown): PublicV3EnlightenRecord {
  return publicV3EnlightenCatalogRecordSchema.parse(value)
}

export function parsePublicV3DerivedSkillRecord(value: unknown): PublicV3DerivedSkillRecord {
  return publicV3DerivedSkillRecordSchema.parse(value)
}

export function parsePublicV3DerivedSkillCatalogRecord(value: unknown): PublicV3DerivedSkillRecord {
  return publicV3DerivedSkillCatalogRecordSchema.parse(value)
}

export function parsePublicV3OverlayRecord(value: unknown): PublicV3OverlayRecord {
  return publicV3OverlayRecordSchema.parse(value)
}

export function parsePublicV3OverlayCatalogRecord(value: unknown): PublicV3OverlayRecord {
  return publicV3OverlayCatalogRecordSchema.parse(value)
}

export function adaptPublicV3SkillRecord(record: PublicV3SkillRecord): AwakenerSkillRecord {
  return publicV3AwakenerSkillSchema.parse({
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    kind: skillKindFromPublicSlot(record.slot),
    displayName: record.name,
    cardKeywords: record.cardKeywords ?? [],
    cardTypes: record.cardTypes ?? [],
    countsAs: record.countsAs ?? [],
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    variants: [],
  })
}

export function adaptPublicV3TalentRecord(record: PublicV3TalentRecord): AwakenerTalentRecord {
  return publicV3AwakenerTalentSchema.parse({
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    hasLevelScaledDescription: record.maxLevel !== undefined,
  })
}

export function adaptPublicV3EnlightenRecord(
  record: PublicV3EnlightenRecord,
): AwakenerEnlightenRecord {
  return publicV3AwakenerEnlightenSchema.parse({
    ...record,
    ownerAwakenerId: numericAwakenerId(record.ownerAwakenerId ?? ''),
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
  })
}

export function adaptPublicV3DerivedSkillRecord(
  record: PublicV3DerivedSkillRecord,
): DerivedSkillRecord {
  return publicV3DerivedSkillSchema.parse({
    ...record,
    ownerAwakenerId: optionalNumericAwakenerId(record.ownerAwakenerId),
    displayName: record.name,
    childDerivedSkillIds: record.childDerivedSkillIds ?? [],
    childPosseIds: record.childPosseIds ?? [],
    cardKeywords: record.cardKeywords ?? [],
    cardTypes: record.cardTypes ?? [],
    countsAs: record.countsAs ?? [],
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
    variants: [],
  })
}

export function adaptPublicV3OverlayRecord(
  record: PublicV3OverlayRecord,
): PublicUpgradeableOverlayRecord {
  const iconId =
    record.iconId ??
    (record.assets?.icon ? resolvePublicAsset(record.assets.icon)?.assetId : undefined)

  const overlay = publicV3AwakenerOverlaySchema.parse({
    ...record,
    ownerAwakenerId: optionalNumericAwakenerId(record.ownerAwakenerId),
    displayName: record.name,
    aliases: record.aliases ?? [],
    iconId,
    descriptionTemplate: record.descriptionTemplate ?? '',
    descriptionArgs: record.descriptionArgs ?? {},
  })

  return {
    ...overlay,
    upgrades: record.upgrades,
  }
}
