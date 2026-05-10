import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'
import type {PublicDataScope, PublicRecord} from '@/data-access/public-data/contract'
import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {
  fullStatsSchema,
  primaryScalingBaseSchema,
  statScalingSchema,
  substatScalingSchema,
  type AwakenerEnlightenRecord,
  type AwakenerOverlayRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type DerivedSkillRecord,
} from './awakener-source-schema'
import type {AwakenerFullRecord} from './awakeners-full'
import type {CovenantFullRecord} from './covenants-full'
import {isLegacyPromotedDerivedExtra} from './legacy-public-v3-adapter/compatibilityOverrides'
import type {PosseFullRecord} from './posses-full'
import {publicDescriptionArgsSchema} from './public-description-args.schema'
import {
  adaptPublicV3DerivedSkillRecord,
  adaptPublicV3EnlightenRecord,
  adaptPublicV3OverlayRecord,
  adaptPublicV3SkillRecord,
  adaptPublicV3TalentRecord,
} from './public-v3-awakener-record-adapters'
import {buildWheelMainstatSeriesKey, type WheelMainstatKey} from './wheel-mainstat-scaling'
import type {WheelFullRecord} from './wheels-full'

type PublicV3AwakenerRecord = PublicRecord & {
  aliases?: string[]
  baseStatsLv1?: Partial<Record<string, number>>
  faction: string
  ingameId?: string
  name: string
  numericId: number
  primaryScalingBase: AwakenerFullRecord['primaryScalingBase']
  profile?: AwakenerFullRecord['profile']
  rarity?: string
  realm: string
  searchTags?: string[]
  statScaling: AwakenerFullRecord['statScaling']
  substatsLv1?: Partial<Record<string, number>>
  substatScaling?: Partial<Record<string, number>>
  type?: string
}
type PublicV3DerivedSkillRecord = PublicRecord & {
  cardKeywords?: unknown[]
  childDerivedSkillIds?: string[]
  ownerAwakenerId?: string
  upgrades?: PublicV3UpgradeEntry[]
}
type PublicV3EnlightenRecord = PublicRecord & {
  ownerAwakenerId?: string
  slot?: string
}
type PublicV3OverlayRecord = PublicRecord & {
  aliases?: string[]
  descriptionArgs?: unknown
  descriptionTemplate?: string
  iconId?: string
  ownerAwakenerId?: string
  overlayType?: string
  upgrades?: PublicV3UpgradeEntry[]
}
type PublicV3SkillRecord = PublicRecord & {
  cardKeywords?: unknown[]
  descriptionArgs?: unknown
  descriptionTemplate?: string
  ownerAwakenerId?: string
  slot?: string
  upgrades?: PublicV3UpgradeEntry[]
}
type PublicV3TalentRecord = PublicRecord & {
  descriptionArgs?: unknown
  descriptionTemplate?: string
  family?: string
  maxLevel?: number
  ownerAwakenerId?: string
}
type PublicV3WheelRecord = PublicRecord & {
  aliases?: string[]
  descriptionArgs: WheelFullRecord['descriptionArgs']
  descriptionTemplate: string
  lore?: string
  mainstatKey: string
  mainstatSeriesKey?: string
  name: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  rarity: string
  realm: WheelFullRecord['realm']
  searchTags?: string[]
}
type PublicV3PosseRecord = PublicRecord & {
  acquisitionSource?: string
  descriptionArgs: PosseFullRecord['descriptionArgs']
  descriptionTemplate: string
  lore?: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  realm: string
}
type PublicV3CovenantRecord = PublicRecord & {
  acquisitionSource?: string
  lore?: string
  setEffects: CovenantFullRecord['setEffects']
}
interface PublicV3UpgradeEntry {
  id?: string
  upgraderId?: string
  upgraderType?: string
  upgraderSlot?: string
  ownerAwakenerId?: string
  operation?: string
  patch?: Record<string, unknown>
}

const numericRecordSchema = z.record(z.string(), z.number())
const publicAwakenerDetailSchema = z.looseObject({
  id: z.string(),
  aliases: z.array(z.string()).optional(),
  baseStatsLv1: numericRecordSchema.optional(),
  faction: z.string(),
  ingameId: z.string().optional(),
  name: z.string(),
  numericId: z.number(),
  primaryScalingBase: primaryScalingBaseSchema,
  profile: z.unknown().optional(),
  rarity: z.string().optional(),
  realm: z.string(),
  searchTags: z.array(z.string()).optional(),
  statScaling: statScalingSchema,
  substatsLv1: numericRecordSchema.optional(),
  substatScaling: numericRecordSchema.optional(),
  type: z.string().optional(),
})
const publicWheelDetailSchema = z.looseObject({
  id: z.string(),
  aliases: z.array(z.string()).optional(),
  descriptionArgs: publicDescriptionArgsSchema,
  descriptionTemplate: z.string(),
  lore: z.string().optional(),
  mainstatKey: z.string(),
  mainstatSeriesKey: z.string().optional(),
  name: z.string(),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
  rarity: z.string(),
  realm: z.enum(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL', 'OTHER']),
  searchTags: z.array(z.string()).optional(),
})
const publicPosseDetailSchema = z.looseObject({
  acquisitionSource: z.string().optional(),
  id: z.string(),
  descriptionArgs: publicDescriptionArgsSchema,
  descriptionTemplate: z.string(),
  lore: z.string().optional(),
  name: z.string(),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
  realm: z.string(),
})
const publicCovenantDetailSchema = z.looseObject({
  acquisitionSource: z.string().optional(),
  id: z.string(),
  lore: z.string().optional(),
  name: z.string(),
  setEffects: z.array(
    z.object({
      set: z.number(),
      descriptionArgs: publicDescriptionArgsSchema,
      descriptionTemplate: z.string(),
    }),
  ),
})

const awakenerFullByIdPromises = new Map<string, Promise<AwakenerFullRecord | undefined>>()
const wheelFullByIdPromises = new Map<string, Promise<WheelFullRecord | undefined>>()
const posseFullByIdPromises = new Map<string, Promise<PosseFullRecord | undefined>>()
const covenantFullByIdPromises = new Map<string, Promise<CovenantFullRecord | undefined>>()
const detailRecordByIdPromises = new Map<string, Promise<PublicRecord | undefined>>()
const SUBSTAT_PERCENT_KEYS = new Set([
  'CritRate',
  'CritDamage',
  'SigilYield',
  'DamageAmplification',
  'DeathResistance',
])

function isPublicAwakenerId(id: string): boolean {
  return /^awakener-\d{4}$/.test(id)
}

function isPublicWheelId(id: string): boolean {
  return /^wheel-\d{4}$/.test(id)
}

function isPublicPosseId(id: string): boolean {
  return /^posse-\d{4}$/.test(id)
}

function isPublicCovenantId(id: string): boolean {
  return /^covenant-\d{4}$/.test(id)
}

function isPublicRecordId(scope: PublicDataScope, id: string): boolean {
  switch (scope) {
    case 'derived-skills':
      return /^derived\.[a-z0-9][a-z0-9.-]*$/.test(id)
    case 'enlightens':
      return /^enlighten\.[a-z0-9][a-z0-9.-]*$/.test(id)
    case 'overlays':
      return /^overlay\.[a-z0-9][a-z0-9.-]*$/.test(id)
    case 'relics':
      return /^relic-\d{4}$/.test(id)
    case 'skills':
      return /^skill\.[a-z0-9][a-z0-9.-]*$/.test(id)
    case 'talents':
      return /^talent\.[a-z0-9][a-z0-9.-]*$/.test(id)
    default:
      return false
  }
}

function resolvePublicAwakenerId(awakenerId: string | number): string | undefined {
  if (typeof awakenerId === 'string' && isPublicAwakenerId(awakenerId)) {
    return awakenerId
  }

  const numericId = typeof awakenerId === 'number' ? awakenerId : Number.parseInt(awakenerId, 10)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return undefined
  }

  return getPublicCatalogRecords('awakeners').find((record) => record.numericId === numericId)?.id
}

function formatPublicStatValue(key: string, value: number): string {
  const normalizedValue = Math.abs(value) < 0.0001 ? 0 : Math.round(value * 10) / 10
  return `${String(normalizedValue)}${SUBSTAT_PERCENT_KEYS.has(key) ? '%' : ''}`
}

function adaptPublicAwakenerStats(record: PublicV3AwakenerRecord) {
  const primaryStats = record.baseStatsLv1 ?? {}
  const substats = record.substatsLv1 ?? {}
  const substatScaling = record.substatScaling ?? {}

  const adaptedSubstats = Object.fromEntries(
    Object.entries(substats).map(([key, rawValue]) => {
      const value = rawValue ?? 0
      const growth = substatScaling[key] ?? 0
      return [key, formatPublicStatValue(key, value + growth * 5)]
    }),
  )

  return {
    CON: formatPublicStatValue('CON', primaryStats.CON ?? 0),
    ATK: formatPublicStatValue('ATK', primaryStats.ATK ?? 0),
    DEF: formatPublicStatValue('DEF', primaryStats.DEF ?? 0),
    ...adaptedSubstats,
  }
}

function adaptPublicSubstatScaling(record: PublicV3AwakenerRecord) {
  return Object.fromEntries(
    Object.entries(record.substatScaling ?? {}).flatMap(([key, value]) =>
      value === undefined || value === 0 ? [] : [[key, formatPublicStatValue(key, value)]],
    ),
  )
}

function resolvePublicAssetId(entityId: string, slot: string): string | undefined {
  const assetIndexId = resolvePublicEntityAsset(entityId, slot)
  return assetIndexId ? resolvePublicAsset(assetIndexId)?.assetId : undefined
}

function getAwakenerAssetKey(record: PublicV3AwakenerRecord): string {
  return record.route?.slug ?? record.id
}

function getWheelPublicAssetId(wheelId: string): string {
  return resolvePublicAssetId(wheelId, 'icon') ?? 'TBD'
}

function getPossePublicAssetId(posseId: string, slot: string): string | undefined {
  return resolvePublicAssetId(posseId, slot)
}

function getCovenantPublicAssetId(covenantId: string): string {
  return resolvePublicAssetId(covenantId, 'icon') ?? ''
}

function getSlotRecord<T extends {slot?: string}>(records: T[], slot: string): T | undefined {
  return records.find((record) => record.slot === slot)
}

function requireSlotRecord<T extends {id: string; slot?: string}>(
  records: T[],
  slot: string,
  label: string,
): T {
  const record = getSlotRecord(records, slot)
  if (!record) {
    throw new Error(`Missing public detail ${label} record for slot ${slot}.`)
  }
  return record
}

function getTalentByFamily(
  records: PublicV3TalentRecord[],
  family: string,
): PublicV3TalentRecord | undefined {
  return records.find((record) => record.family === family)
}

function adaptPublicCardRecord(record: PublicV3SkillRecord, ownerPublicId: string) {
  return adaptPublicV3SkillRecord({
    ...record,
    ownerAwakenerId: record.ownerAwakenerId ?? ownerPublicId,
  })
}

function adaptPublicDerivedRecord(record: PublicV3DerivedSkillRecord) {
  return adaptPublicV3DerivedSkillRecord(record)
}

function adaptPublicTalentRecord(record: PublicV3TalentRecord) {
  return adaptPublicV3TalentRecord(record)
}

function adaptPublicEnlightenRecord(record: PublicV3EnlightenRecord) {
  return adaptPublicV3EnlightenRecord(record)
}

function adaptPublicOverlayRecord(record: PublicV3OverlayRecord) {
  return adaptPublicV3OverlayRecord(record)
}

async function loadPublicRecordsByIds<TRecord extends PublicRecord>(
  scope: PublicDataScope,
  ids: string[] | undefined,
): Promise<TRecord[]> {
  const records = await Promise.all((ids ?? []).map((id) => loadPublicRecord(scope, id)))
  return records.filter((record): record is TRecord => Boolean(record))
}

async function loadPublicDetailRecordById<TRecord extends PublicRecord>(
  scope: PublicDataScope,
  id: string,
): Promise<TRecord | undefined> {
  if (!isPublicRecordId(scope, id)) {
    return undefined
  }

  const cacheKey = `${scope}:${id}`
  const cachedPromise = detailRecordByIdPromises.get(cacheKey)
  if (cachedPromise) {
    return cachedPromise as Promise<TRecord | undefined>
  }

  const recordPromise = loadPublicRecord(scope, id)
  detailRecordByIdPromises.set(cacheKey, recordPromise)
  return recordPromise as Promise<TRecord | undefined>
}

function parsePublicDetailRecord(scope: 'awakeners', value: unknown): PublicV3AwakenerRecord
function parsePublicDetailRecord(scope: 'wheels', value: unknown): PublicV3WheelRecord
function parsePublicDetailRecord(scope: 'posses', value: unknown): PublicV3PosseRecord
function parsePublicDetailRecord(scope: 'covenants', value: unknown): PublicV3CovenantRecord
function parsePublicDetailRecord(
  scope: PublicDataScope,
  value: unknown,
): PublicV3AwakenerRecord | PublicV3WheelRecord | PublicV3PosseRecord | PublicV3CovenantRecord {
  if (scope === 'awakeners') {
    return publicAwakenerDetailSchema.parse(value) as PublicV3AwakenerRecord
  }
  if (scope === 'wheels') {
    return publicWheelDetailSchema.parse(value) as PublicV3WheelRecord
  }
  if (scope === 'posses') {
    return publicPosseDetailSchema.parse(value) as PublicV3PosseRecord
  }
  if (scope === 'covenants') {
    return publicCovenantDetailSchema.parse(value) as PublicV3CovenantRecord
  }

  throw new Error(`Unsupported public detail scope: ${scope}`)
}

function parsePublicPosseDetailRecord(value: unknown): PublicV3PosseRecord {
  return publicPosseDetailSchema.parse(value) as PublicV3PosseRecord
}

function parsePublicCovenantDetailRecord(value: unknown): PublicV3CovenantRecord {
  return publicCovenantDetailSchema.parse(value) as PublicV3CovenantRecord
}

async function loadAwakenerOwnedRecords(publicAwakenerId: string) {
  const {getPublicRelationshipsIndex} =
    await import('@/data-access/public-data/relationshipRepository')
  const relationships = getPublicRelationshipsIndex().forward[publicAwakenerId] ?? {}
  const [ownedSkills, ownedTalents, ownedEnlightens, ownedDerivedSkills, ownedOverlays] =
    await Promise.all([
      loadPublicRecordsByIds<PublicV3SkillRecord>('skills', relationships.ownedSkills),
      loadPublicRecordsByIds<PublicV3TalentRecord>('talents', relationships.ownedTalents),
      loadPublicRecordsByIds<PublicV3EnlightenRecord>('enlightens', relationships.ownedEnlightens),
      loadPublicRecordsByIds<PublicV3DerivedSkillRecord>(
        'derived-skills',
        relationships.ownedDerivedSkills,
      ),
      loadPublicRecordsByIds<PublicV3OverlayRecord>('overlays', relationships.ownedOverlays),
    ])

  return {
    skills: ownedSkills,
    talents: ownedTalents,
    enlightens: ownedEnlightens,
    derivedSkills: ownedDerivedSkills,
    overlays: ownedOverlays,
  }
}

async function adaptPublicAwakenerRecord(
  record: PublicV3AwakenerRecord,
): Promise<AwakenerFullRecord> {
  const ownedRecords = await loadAwakenerOwnedRecords(record.id)
  const regularDerivedSkills = ownedRecords.derivedSkills.filter(
    (entry) => !isLegacyPromotedDerivedExtra(entry.id),
  )
  const cards = {
    C1: adaptPublicCardRecord(requireSlotRecord(ownedRecords.skills, 'Rouse', 'skill'), record.id),
    C2: adaptPublicCardRecord(requireSlotRecord(ownedRecords.skills, 'Strike', 'skill'), record.id),
    C3: adaptPublicCardRecord(
      requireSlotRecord(ownedRecords.skills, 'Defense', 'skill'),
      record.id,
    ),
    C4: adaptPublicCardRecord(requireSlotRecord(ownedRecords.skills, 'Skill1', 'skill'), record.id),
    C5: adaptPublicCardRecord(requireSlotRecord(ownedRecords.skills, 'Skill2', 'skill'), record.id),
    Exalt: adaptPublicCardRecord(
      requireSlotRecord(ownedRecords.skills, 'Exalt', 'skill'),
      record.id,
    ),
    OverExalt: getSlotRecord(ownedRecords.skills, 'OverExalt')
      ? adaptPublicCardRecord(
          requireSlotRecord(ownedRecords.skills, 'OverExalt', 'skill'),
          record.id,
        )
      : undefined,
    promotedExtras: ownedRecords.derivedSkills
      .filter((entry) => isLegacyPromotedDerivedExtra(entry.id))
      .map(adaptPublicDerivedRecord),
  }

  const passiveTalents = ownedRecords.talents.filter((talent) => talent.family === 'passive')
  const talents: AwakenerFullRecord['talents'] = {
    extraTalents: passiveTalents.slice(1).map((talent) => adaptPublicTalentRecord(talent)),
  }
  if (passiveTalents[0]) {
    talents.T1 = adaptPublicTalentRecord(passiveTalents[0])
  }

  const madnessOmen = getTalentByFamily(ownedRecords.talents, 'madness_omen')
  const soulforgeAptitude = getTalentByFamily(ownedRecords.talents, 'soulforge_aptitude')
  if (madnessOmen) {
    talents.T2 = adaptPublicTalentRecord(madnessOmen)
  }
  if (soulforgeAptitude) {
    talents.T3 = adaptPublicTalentRecord(soulforgeAptitude)
  }

  const assetKey = getAwakenerAssetKey(record)
  const adapted: AwakenerFullRecord = {
    id: record.numericId,
    key: assetKey,
    displayName: record.name,
    ingameId: record.ingameId,
    faction: record.faction,
    realm: record.realm,
    rarity: record.rarity,
    type: record.type,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    stats: fullStatsSchema.parse(adaptPublicAwakenerStats(record)),
    primaryScalingBase: record.primaryScalingBase,
    statScaling: record.statScaling,
    substatScaling: substatScalingSchema.parse(adaptPublicSubstatScaling(record)),
    assets: {portraitKey: assetKey, iconKey: assetKey},
    profile: record.profile,
    cards,
    talents,
    enlightens: {
      E1: adaptPublicEnlightenRecord(requireSlotRecord(ownedRecords.enlightens, 'E1', 'enlighten')),
      E2: adaptPublicEnlightenRecord(requireSlotRecord(ownedRecords.enlightens, 'E2', 'enlighten')),
      E3: adaptPublicEnlightenRecord(requireSlotRecord(ownedRecords.enlightens, 'E3', 'enlighten')),
      AbsoluteAxiom: getSlotRecord(ownedRecords.enlightens, 'AbsoluteAxiom')
        ? adaptPublicEnlightenRecord(
            requireSlotRecord(ownedRecords.enlightens, 'AbsoluteAxiom', 'enlighten'),
          )
        : undefined,
    },
    derivedSkills: regularDerivedSkills.map(adaptPublicDerivedRecord),
    overlays: ownedRecords.overlays.map(adaptPublicOverlayRecord),
  }

  return adapted
}

function adaptPublicWheelRecord(record: PublicV3WheelRecord): WheelFullRecord {
  const mainstatKey = record.mainstatKey as WheelMainstatKey
  const rarity = record.rarity as WheelFullRecord['rarity']
  return {
    ...record,
    assetId: getWheelPublicAssetId(record.id),
    mainstatKey,
    rarity,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    awakener: record.ownerAwakenerName,
    mainstatSeriesKey: record.mainstatSeriesKey ?? buildWheelMainstatSeriesKey(rarity, mainstatKey),
  }
}

function adaptPublicPosseRecord(record: PublicV3PosseRecord): PosseFullRecord {
  return {
    ...record,
    assetId: getPossePublicAssetId(record.id, 'icon') ?? '',
    assetCrystalId: getPossePublicAssetId(record.id, 'crystal'),
    assetBadgeId: getPossePublicAssetId(record.id, 'badge'),
  }
}

function adaptPublicCovenantRecord(record: PublicV3CovenantRecord): CovenantFullRecord {
  return {
    ...record,
    assetId: getCovenantPublicAssetId(record.id),
  }
}

export async function loadPublicAwakenerDetailById(
  awakenerId: string | number,
): Promise<AwakenerFullRecord | undefined> {
  const publicId = resolvePublicAwakenerId(awakenerId)
  if (!publicId) {
    return undefined
  }

  const cachedPromise = awakenerFullByIdPromises.get(publicId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('awakeners', publicId).then((record) =>
    record ? adaptPublicAwakenerRecord(parsePublicDetailRecord('awakeners', record)) : undefined,
  )
  awakenerFullByIdPromises.set(publicId, recordPromise)
  return recordPromise
}

export async function loadPublicWheelDetailById(
  wheelId: string,
): Promise<WheelFullRecord | undefined> {
  if (!isPublicWheelId(wheelId)) {
    return undefined
  }

  const cachedPromise = wheelFullByIdPromises.get(wheelId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('wheels', wheelId).then((record) =>
    record ? adaptPublicWheelRecord(parsePublicDetailRecord('wheels', record)) : undefined,
  )
  wheelFullByIdPromises.set(wheelId, recordPromise)
  return recordPromise
}

export async function loadPublicPosseDetailById(
  posseId: string,
): Promise<PosseFullRecord | undefined> {
  if (!isPublicPosseId(posseId)) {
    return undefined
  }

  const cachedPromise = posseFullByIdPromises.get(posseId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('posses', posseId).then((record) =>
    record ? adaptPublicPosseRecord(parsePublicPosseDetailRecord(record)) : undefined,
  )
  posseFullByIdPromises.set(posseId, recordPromise)
  return recordPromise
}

export async function loadPublicCovenantDetailById(
  covenantId: string,
): Promise<CovenantFullRecord | undefined> {
  if (!isPublicCovenantId(covenantId)) {
    return undefined
  }

  const cachedPromise = covenantFullByIdPromises.get(covenantId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord('covenants', covenantId).then((record) =>
    record ? adaptPublicCovenantRecord(parsePublicCovenantDetailRecord(record)) : undefined,
  )
  covenantFullByIdPromises.set(covenantId, recordPromise)
  return recordPromise
}

export async function loadPublicSkillDetailById(
  skillId: string,
): Promise<AwakenerSkillRecord | undefined> {
  const record = await loadPublicDetailRecordById<PublicV3SkillRecord>('skills', skillId)
  return record ? adaptPublicV3SkillRecord(record) : undefined
}

export async function loadPublicTalentDetailById(
  talentId: string,
): Promise<AwakenerTalentRecord | undefined> {
  const record = await loadPublicDetailRecordById<PublicV3TalentRecord>('talents', talentId)
  return record ? adaptPublicV3TalentRecord(record) : undefined
}

export async function loadPublicEnlightenDetailById(
  enlightenId: string,
): Promise<AwakenerEnlightenRecord | undefined> {
  const record = await loadPublicDetailRecordById<PublicV3EnlightenRecord>(
    'enlightens',
    enlightenId,
  )
  return record ? adaptPublicV3EnlightenRecord(record) : undefined
}

export async function loadPublicDerivedSkillDetailById(
  derivedSkillId: string,
): Promise<DerivedSkillRecord | undefined> {
  const record = await loadPublicDetailRecordById<PublicV3DerivedSkillRecord>(
    'derived-skills',
    derivedSkillId,
  )
  return record ? adaptPublicV3DerivedSkillRecord(record) : undefined
}

export async function loadPublicOverlayDetailById(
  overlayId: string,
): Promise<AwakenerOverlayRecord | undefined> {
  const record = await loadPublicDetailRecordById<PublicV3OverlayRecord>('overlays', overlayId)
  return record ? adaptPublicV3OverlayRecord(record) : undefined
}
