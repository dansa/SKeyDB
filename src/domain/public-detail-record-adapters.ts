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
import type {AwakenerFullRecord, AwakenerProfile} from './awakeners-full'
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
  parsePublicV3DerivedSkillRecord,
  parsePublicV3EnlightenRecord,
  parsePublicV3OverlayRecord,
  parsePublicV3SkillRecord,
  parsePublicV3TalentRecord,
  type PublicV3DerivedSkillRecord,
  type PublicV3EnlightenRecord,
  type PublicV3OverlayRecord,
  type PublicV3SkillRecord,
  type PublicV3TalentRecord,
} from './public-v3-awakener-record-adapters'
import {
  buildWheelMainstatSeriesKey,
  WHEEL_MAINSTAT_KEYS,
  type WheelMainstatKey,
} from './wheel-mainstat-scaling'
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
type PublicV3WheelRecord = PublicRecord & {
  aliases?: string[]
  descriptionArgs: WheelFullRecord['descriptionArgs']
  descriptionTemplate: string
  lore?: string
  mainstatKey: WheelMainstatKey
  mainstatSeriesKey?: string
  name: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  rarity: WheelFullRecord['rarity']
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
interface PublicFullDetailLoaderConfig<TRecord extends PublicRecord, TAdaptedRecord> {
  scope: PublicDataScope
  isCanonicalId: (id: string) => boolean
  cache: Map<string, Promise<TAdaptedRecord | undefined>>
  parse: (value: unknown) => TRecord
  adapt: (record: TRecord) => TAdaptedRecord
}
interface PublicChildDetailLoaderConfig<TRecord, TAdaptedRecord> {
  scope: PublicDataScope
  parse: (value: unknown) => TRecord
  adapt: (record: TRecord) => TAdaptedRecord
}

const publicRouteInfoSchema = z.looseObject({
  slug: z.string(),
  canonicalPath: z.string(),
})
const publicAssetsSchema = z.record(z.string(), z.string())
const publicRecordBaseShape = {
  schemaVersion: z.literal(3),
  id: z.string(),
  name: z.string(),
  route: publicRouteInfoSchema.optional(),
  assets: publicAssetsSchema.optional(),
}
const publicAwakenerProfileStorySectionSchema = z.looseObject({
  kind: z.enum(['introduction', 'story']),
  title: z.string(),
  unlockCondition: z.string().optional(),
  content: z.string(),
})
const publicAwakenerProfileSchema: z.ZodType<AwakenerProfile> = z.looseObject({
  title: z.string().optional(),
  birthday: z.string().optional(),
  gender: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  gnosticIndex: z.string().optional(),
  faction: z.string().optional(),
  storySections: z.array(publicAwakenerProfileStorySectionSchema).optional(),
})
const numericRecordSchema = z.record(z.string(), z.number())
const publicAwakenerDetailSchema: z.ZodType<PublicV3AwakenerRecord> = z.looseObject({
  ...publicRecordBaseShape,
  kind: z.literal('awakener'),
  id: z.string(),
  aliases: z.array(z.string()).optional(),
  baseStatsLv1: numericRecordSchema.optional(),
  faction: z.string(),
  ingameId: z.string().optional(),
  name: z.string(),
  numericId: z.number(),
  primaryScalingBase: primaryScalingBaseSchema,
  profile: publicAwakenerProfileSchema.optional(),
  rarity: z.string().optional(),
  realm: z.string(),
  searchTags: z.array(z.string()).optional(),
  statScaling: statScalingSchema,
  substatsLv1: numericRecordSchema.optional(),
  substatScaling: numericRecordSchema.optional(),
  type: z.string().optional(),
})
const publicWheelDetailSchema: z.ZodType<PublicV3WheelRecord> = z.looseObject({
  ...publicRecordBaseShape,
  kind: z.literal('wheel'),
  id: z.string(),
  aliases: z.array(z.string()).optional(),
  descriptionArgs: publicDescriptionArgsSchema,
  descriptionTemplate: z.string(),
  lore: z.string().optional(),
  mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
  mainstatSeriesKey: z.string().optional(),
  name: z.string(),
  ownerAwakenerId: z.string().optional(),
  ownerAwakenerName: z.string().optional(),
  rarity: z.enum(['SSR', 'SR', 'R', 'N']),
  realm: z.enum(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL', 'OTHER']),
  searchTags: z.array(z.string()).optional(),
})
const publicPosseDetailSchema: z.ZodType<PublicV3PosseRecord> = z.looseObject({
  ...publicRecordBaseShape,
  kind: z.literal('posse'),
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
const publicCovenantDetailSchema: z.ZodType<PublicV3CovenantRecord> = z.looseObject({
  ...publicRecordBaseShape,
  kind: z.literal('covenant'),
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

async function loadPublicRecordsByIds<TRecord>(
  scope: PublicDataScope,
  ids: string[] | undefined,
  parse: (value: unknown) => TRecord,
): Promise<TRecord[]> {
  const records = await Promise.all((ids ?? []).map((id) => loadPublicRecord(scope, id)))
  return records.flatMap((record) => (record ? [parse(record)] : []))
}

async function loadPublicDetailRecordById(
  scope: PublicDataScope,
  id: string,
): Promise<PublicRecord | undefined> {
  if (!isPublicRecordId(scope, id)) {
    return undefined
  }

  const cacheKey = `${scope}:${id}`
  const cachedPromise = detailRecordByIdPromises.get(cacheKey)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord(scope, id)
  detailRecordByIdPromises.set(cacheKey, recordPromise)
  return recordPromise
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
    return publicAwakenerDetailSchema.parse(value)
  }
  if (scope === 'wheels') {
    return publicWheelDetailSchema.parse(value)
  }
  if (scope === 'posses') {
    return publicPosseDetailSchema.parse(value)
  }
  if (scope === 'covenants') {
    return publicCovenantDetailSchema.parse(value)
  }

  throw new Error(`Unsupported public detail scope: ${scope}`)
}

async function loadAwakenerOwnedRecords(publicAwakenerId: string) {
  const {getPublicRelationshipsIndex} =
    await import('@/data-access/public-data/relationshipRepository')
  const relationships = getPublicRelationshipsIndex().forward[publicAwakenerId] ?? {}
  const [ownedSkills, ownedTalents, ownedEnlightens, ownedDerivedSkills, ownedOverlays] =
    await Promise.all([
      loadPublicRecordsByIds('skills', relationships.ownedSkills, parsePublicV3SkillRecord),
      loadPublicRecordsByIds('talents', relationships.ownedTalents, parsePublicV3TalentRecord),
      loadPublicRecordsByIds(
        'enlightens',
        relationships.ownedEnlightens,
        parsePublicV3EnlightenRecord,
      ),
      loadPublicRecordsByIds(
        'derived-skills',
        relationships.ownedDerivedSkills,
        parsePublicV3DerivedSkillRecord,
      ),
      loadPublicRecordsByIds('overlays', relationships.ownedOverlays, parsePublicV3OverlayRecord),
    ])

  return {
    skills: ownedSkills,
    talents: ownedTalents,
    enlightens: ownedEnlightens,
    derivedSkills: ownedDerivedSkills,
    overlays: ownedOverlays,
  }
}

type AwakenerOwnedRecords = Awaited<ReturnType<typeof loadAwakenerOwnedRecords>>

class OwnedAwakenerRecordIndex {
  readonly records: AwakenerOwnedRecords
  private readonly skillBySlot = new Map<string, PublicV3SkillRecord>()
  private readonly enlightenBySlot = new Map<string, PublicV3EnlightenRecord>()
  private readonly talentByFamily = new Map<string, PublicV3TalentRecord>()

  constructor(records: AwakenerOwnedRecords) {
    this.records = records
    this.indexSlots(records.skills, this.skillBySlot)
    this.indexSlots(records.enlightens, this.enlightenBySlot)

    for (const talent of records.talents) {
      if (talent.family && !this.talentByFamily.has(talent.family)) {
        this.talentByFamily.set(talent.family, talent)
      }
    }
  }

  getSkillBySlot(slot: string): PublicV3SkillRecord | undefined {
    return this.skillBySlot.get(slot)
  }

  requireSkillBySlot(slot: string): PublicV3SkillRecord {
    return this.requireSlotRecord(this.skillBySlot, slot, 'skill')
  }

  getTalentByFamily(family: string): PublicV3TalentRecord | undefined {
    return this.talentByFamily.get(family)
  }

  getEnlightenBySlot(slot: string): PublicV3EnlightenRecord | undefined {
    return this.enlightenBySlot.get(slot)
  }

  requireEnlightenBySlot(slot: string): PublicV3EnlightenRecord {
    return this.requireSlotRecord(this.enlightenBySlot, slot, 'enlighten')
  }

  private indexSlots<TRecord extends {slot?: string}>(
    records: TRecord[],
    target: Map<string, TRecord>,
  ): void {
    for (const record of records) {
      if (record.slot && !target.has(record.slot)) {
        target.set(record.slot, record)
      }
    }
  }

  private requireSlotRecord<TRecord extends {id: string}>(
    recordsBySlot: Map<string, TRecord>,
    slot: string,
    label: string,
  ): TRecord {
    const record = recordsBySlot.get(slot)
    if (!record) {
      throw new Error(`Missing public detail ${label} record for slot ${slot}.`)
    }
    return record
  }
}

function adaptPublicAwakenerCards(
  ownedRecords: OwnedAwakenerRecordIndex,
  ownerPublicId: string,
): AwakenerFullRecord['cards'] {
  return {
    C1: adaptPublicCardRecord(ownedRecords.requireSkillBySlot('Rouse'), ownerPublicId),
    C2: adaptPublicCardRecord(ownedRecords.requireSkillBySlot('Strike'), ownerPublicId),
    C3: adaptPublicCardRecord(ownedRecords.requireSkillBySlot('Defense'), ownerPublicId),
    C4: adaptPublicCardRecord(ownedRecords.requireSkillBySlot('Skill1'), ownerPublicId),
    C5: adaptPublicCardRecord(ownedRecords.requireSkillBySlot('Skill2'), ownerPublicId),
    Exalt: adaptPublicCardRecord(ownedRecords.requireSkillBySlot('Exalt'), ownerPublicId),
    OverExalt: ownedRecords.getSkillBySlot('OverExalt')
      ? adaptPublicCardRecord(ownedRecords.requireSkillBySlot('OverExalt'), ownerPublicId)
      : undefined,
    promotedExtras: ownedRecords.records.derivedSkills.flatMap((entry) =>
      isLegacyPromotedDerivedExtra(entry.id) ? [adaptPublicDerivedRecord(entry)] : [],
    ),
  }
}

function adaptPublicAwakenerTalents(
  ownedRecords: OwnedAwakenerRecordIndex,
): AwakenerFullRecord['talents'] {
  const passiveTalents = ownedRecords.records.talents.filter(
    (talent) => talent.family === 'passive',
  )
  const gnosticPotential = ownedRecords.getTalentByFamily('gnostic_potential')
  const firstPassiveTalent = passiveTalents.at(0)
  const secondPassiveTalent = passiveTalents.at(1)
  const talents: AwakenerFullRecord['talents'] = {
    orderedTalents: ownedRecords.records.talents.map((talent) => adaptPublicTalentRecord(talent)),
    extraTalents: passiveTalents
      .slice(gnosticPotential ? 1 : 2)
      .map((talent) => adaptPublicTalentRecord(talent)),
  }
  if (firstPassiveTalent) {
    talents.T1 = adaptPublicTalentRecord(firstPassiveTalent)
  }

  const madnessOmen = ownedRecords.getTalentByFamily('madness_omen')
  const soulforgeAptitude = ownedRecords.getTalentByFamily('soulforge_aptitude')
  if (madnessOmen) {
    talents.T2 = adaptPublicTalentRecord(madnessOmen)
  }
  if (soulforgeAptitude) {
    talents.T3 = adaptPublicTalentRecord(soulforgeAptitude)
  }
  if (gnosticPotential) {
    talents.T4 = adaptPublicTalentRecord(gnosticPotential)
  } else if (secondPassiveTalent) {
    talents.T4 = adaptPublicTalentRecord(secondPassiveTalent)
  }

  return talents
}

function adaptPublicAwakenerEnlightens(
  ownedRecords: OwnedAwakenerRecordIndex,
): AwakenerFullRecord['enlightens'] {
  return {
    E1: adaptPublicEnlightenRecord(ownedRecords.requireEnlightenBySlot('E1')),
    E2: adaptPublicEnlightenRecord(ownedRecords.requireEnlightenBySlot('E2')),
    E3: adaptPublicEnlightenRecord(ownedRecords.requireEnlightenBySlot('E3')),
    AbsoluteAxiom: ownedRecords.getEnlightenBySlot('AbsoluteAxiom')
      ? adaptPublicEnlightenRecord(ownedRecords.requireEnlightenBySlot('AbsoluteAxiom'))
      : undefined,
  }
}

async function adaptPublicAwakenerRecord(
  record: PublicV3AwakenerRecord,
): Promise<AwakenerFullRecord> {
  const ownedRecords = new OwnedAwakenerRecordIndex(await loadAwakenerOwnedRecords(record.id))
  const regularDerivedSkills = ownedRecords.records.derivedSkills.filter(
    (entry) => !isLegacyPromotedDerivedExtra(entry.id),
  )

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
    cards: adaptPublicAwakenerCards(ownedRecords, record.id),
    talents: adaptPublicAwakenerTalents(ownedRecords),
    enlightens: adaptPublicAwakenerEnlightens(ownedRecords),
    derivedSkills: regularDerivedSkills.map(adaptPublicDerivedRecord),
    overlays: ownedRecords.records.overlays.map(adaptPublicOverlayRecord),
  }

  return adapted
}

function adaptPublicWheelRecord(record: PublicV3WheelRecord): WheelFullRecord {
  return {
    ...record,
    assetId: getWheelPublicAssetId(record.id),
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    awakener: record.ownerAwakenerName,
    mainstatSeriesKey:
      record.mainstatSeriesKey ?? buildWheelMainstatSeriesKey(record.rarity, record.mainstatKey),
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

async function loadPublicFullDetailById<TRecord extends PublicRecord, TAdaptedRecord>(
  id: string,
  config: PublicFullDetailLoaderConfig<TRecord, TAdaptedRecord>,
): Promise<TAdaptedRecord | undefined> {
  if (!config.isCanonicalId(id)) {
    return undefined
  }

  const cachedPromise = config.cache.get(id)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicRecord(config.scope, id).then((record) =>
    record ? config.adapt(config.parse(record)) : undefined,
  )
  config.cache.set(id, recordPromise)
  return recordPromise
}

async function loadPublicChildDetailById<TRecord, TAdaptedRecord>(
  id: string,
  config: PublicChildDetailLoaderConfig<TRecord, TAdaptedRecord>,
): Promise<TAdaptedRecord | undefined> {
  const record = await loadPublicDetailRecordById(config.scope, id)
  return record ? config.adapt(config.parse(record)) : undefined
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
  return loadPublicFullDetailById(wheelId, {
    scope: 'wheels',
    isCanonicalId: isPublicWheelId,
    cache: wheelFullByIdPromises,
    parse: (record) => parsePublicDetailRecord('wheels', record),
    adapt: adaptPublicWheelRecord,
  })
}

export async function loadPublicPosseDetailById(
  posseId: string,
): Promise<PosseFullRecord | undefined> {
  return loadPublicFullDetailById(posseId, {
    scope: 'posses',
    isCanonicalId: isPublicPosseId,
    cache: posseFullByIdPromises,
    parse: (record) => parsePublicDetailRecord('posses', record),
    adapt: adaptPublicPosseRecord,
  })
}

export async function loadPublicCovenantDetailById(
  covenantId: string,
): Promise<CovenantFullRecord | undefined> {
  return loadPublicFullDetailById(covenantId, {
    scope: 'covenants',
    isCanonicalId: isPublicCovenantId,
    cache: covenantFullByIdPromises,
    parse: (record) => parsePublicDetailRecord('covenants', record),
    adapt: adaptPublicCovenantRecord,
  })
}

export async function loadPublicSkillDetailById(
  skillId: string,
): Promise<AwakenerSkillRecord | undefined> {
  return loadPublicChildDetailById(skillId, {
    scope: 'skills',
    parse: parsePublicV3SkillRecord,
    adapt: adaptPublicV3SkillRecord,
  })
}

export async function loadPublicTalentDetailById(
  talentId: string,
): Promise<AwakenerTalentRecord | undefined> {
  return loadPublicChildDetailById(talentId, {
    scope: 'talents',
    parse: parsePublicV3TalentRecord,
    adapt: adaptPublicV3TalentRecord,
  })
}

export async function loadPublicEnlightenDetailById(
  enlightenId: string,
): Promise<AwakenerEnlightenRecord | undefined> {
  return loadPublicChildDetailById(enlightenId, {
    scope: 'enlightens',
    parse: parsePublicV3EnlightenRecord,
    adapt: adaptPublicV3EnlightenRecord,
  })
}

export async function loadPublicDerivedSkillDetailById(
  derivedSkillId: string,
): Promise<DerivedSkillRecord | undefined> {
  return loadPublicChildDetailById(derivedSkillId, {
    scope: 'derived-skills',
    parse: parsePublicV3DerivedSkillRecord,
    adapt: adaptPublicV3DerivedSkillRecord,
  })
}

export async function loadPublicOverlayDetailById(
  overlayId: string,
): Promise<AwakenerOverlayRecord | undefined> {
  return loadPublicChildDetailById(overlayId, {
    scope: 'overlays',
    parse: parsePublicV3OverlayRecord,
    adapt: adaptPublicV3OverlayRecord,
  })
}
