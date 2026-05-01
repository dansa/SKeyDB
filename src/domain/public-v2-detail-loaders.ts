import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {type PublicV2Record} from './public-v2-schema'
import {loadPublicV2Envelope, loadPublicV2FullRecord} from './public-v2-loaders'
import {
  buildWheelMainstatSeriesKey,
  type WheelMainstatKey,
  type WheelMainstatSeriesRarity,
} from './wheel-mainstat-scaling'
import {type WheelFullV1Record} from './wheels-full-v1'

type PublicV2AwakenerRecord = PublicV2Record<'awakeners'> & {
  aliases?: string[]
  assets?: {portraitKey?: string}
  baseStatsLv1?: unknown
  name: string
  numericId: number
  searchTags?: string[]
}
type PublicV2DerivedSkillRecord = PublicV2Record<'derived-skills'> & {
  cardKeywords?: unknown[]
  childDerivedSkillIds?: string[]
  ownerAwakenerId?: string
  upgrades?: PublicV2UpgradeEntry[]
}
type PublicV2EnlightenRecord = PublicV2Record<'enlightens'> & {
  ownerAwakenerId?: string
  slot?: string
}
type PublicV2OverlayRecord = PublicV2Record<'overlays'> & {
  ownerAwakenerId?: string
  upgrades?: PublicV2UpgradeEntry[]
}
type PublicV2SkillRecord = PublicV2Record<'skills'> & {
  ownerAwakenerId?: string
  slot?: string
  upgrades?: PublicV2UpgradeEntry[]
}
type PublicV2TalentRecord = PublicV2Record<'talents'> & {
  family?: string
  maxLevel?: number
  ownerAwakenerId?: string
}
type PublicV2WheelRecord = PublicV2Record<'wheels'> & {
  aliases?: string[]
  mainstatKey: string
  mainstatSeriesKey?: string
  name: string
  ownerAwakenerName?: string
  rarity: string
  searchTags?: string[]
}
type PublicV2UpgradeableRecord =
  | PublicV2DerivedSkillRecord
  | PublicV2OverlayRecord
  | PublicV2SkillRecord

interface PublicV2UpgradeEntry {
  upgraderId?: string
  upgraderType?: string
  operation?: string
  patch?: Record<string, unknown>
}

type LegacyPatchTargetType = 'skill' | 'derived-skill' | 'overlay'

const PROMOTED_EXTRA_DERIVED_IDS = new Set([
  'derived.castor.onyx-plume',
  'derived.corposant.pilot',
  'derived.doll-inferno.illusions-end',
  'derived.doresain.evernights-revel',
  'derived.helot-catena.bloodthirsty-flail',
  'derived.jenkins.swarm-impact',
  'derived.kathigu-ra.hyperflare',
  'derived.liz.corrupted-flames',
  'derived.pollux.sacred-heart',
  'derived.tawil.four-wings',
  'derived.tawil.six-wings',
  'derived.tawil.twin-wings',
  'derived.vortice.vortex-shell',
])

const awakenerFullByIdPromises = new Map<string, Promise<AwakenerFullV2Record | undefined>>()
const wheelFullByIdPromises = new Map<string, Promise<WheelFullV1Record | undefined>>()

function isPublicAwakenerId(id: string): boolean {
  return /^awakener-\d{4}$/.test(id)
}

function isPublicWheelId(id: string): boolean {
  return /^wheel-\d{4}$/.test(id)
}

async function resolvePublicAwakenerId(awakenerId: string | number): Promise<string | undefined> {
  if (typeof awakenerId === 'string' && isPublicAwakenerId(awakenerId)) {
    return awakenerId
  }

  const numericId =
    typeof awakenerId === 'number' ? awakenerId : Number.parseInt(awakenerId, 10)

  if (!Number.isInteger(numericId) || numericId <= 0) {
    return undefined
  }

  const envelope = await loadPublicV2Envelope('lite', 'awakeners')
  return envelope.records.find((record) => record.numericId === numericId)?.id
}

function numericAwakenerId(publicAwakenerId: string): number {
  const suffix = /^awakener-(\d{4})$/.exec(publicAwakenerId)?.[1]
  return suffix ? Number(suffix) : 0
}

function withLegacyOwner<T extends {ownerAwakenerId?: string}>(record: T): T {
  return {
    ...record,
    ownerAwakenerId: record.ownerAwakenerId ? numericAwakenerId(record.ownerAwakenerId) : undefined,
  } as T
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
    throw new Error(`Missing public V2 ${label} record for slot ${slot}.`)
  }
  return record
}

function getTalentByFamily(
  records: PublicV2TalentRecord[],
  family: string,
): PublicV2TalentRecord | undefined {
  return records.find((record) => record.family === family)
}

function upgradePatchTargetType(
  scope: 'derived-skills' | 'overlays' | 'skills',
): LegacyPatchTargetType {
  if (scope === 'derived-skills') {
    return 'derived-skill'
  }
  if (scope === 'overlays') {
    return 'overlay'
  }
  return 'skill'
}

function toLegacyPatch(
  upgrade: PublicV2UpgradeEntry,
  targetId: string,
  targetType: LegacyPatchTargetType,
) {
  if (!upgrade.operation || upgrade.operation === 'link_only') {
    return null
  }

  const patch = upgrade.patch ?? {}
  if (upgrade.operation === 'override_card_keywords') {
    return {
      targetId,
      targetType,
      operation: 'card_keywords',
      addCardKeywords: patch.cardKeywords,
    }
  }

  return {
    targetId,
    targetType,
    operation: upgrade.operation,
    ...patch,
  }
}

function collectUpgradeTargetsByUpgrader(
  records: PublicV2UpgradeableRecord[],
  targetType: LegacyPatchTargetType,
): Map<string, {targetIds: Set<string>; patches: unknown[]}> {
  const byUpgrader = new Map<string, {targetIds: Set<string>; patches: unknown[]}>()
  for (const record of records) {
    for (const upgrade of record.upgrades ?? []) {
      if (!upgrade.upgraderId) {
        continue
      }
      const entry = byUpgrader.get(upgrade.upgraderId) ?? {targetIds: new Set(), patches: []}
      entry.targetIds.add(record.id)
      const patch = toLegacyPatch(upgrade, record.id, targetType)
      if (patch) {
        entry.patches.push(patch)
      }
      byUpgrader.set(upgrade.upgraderId, entry)
    }
  }
  return byUpgrader
}

function applyLegacyUpgradeFields<T extends {id: string}>(
  record: T,
  upgradeTargetsByUpgrader: Map<string, {targetIds: Set<string>; patches: unknown[]}>,
): T {
  const upgrades = upgradeTargetsByUpgrader.get(record.id)
  return {
    ...record,
    upgradeTargetIds: upgrades ? [...upgrades.targetIds] : [],
    upgradePatches: upgrades ? upgrades.patches : [],
  } as T
}

function adaptPublicV2CardRecord(record: PublicV2SkillRecord, ownerPublicId: string) {
  return withLegacyOwner({
    ...record,
    ownerAwakenerId: ownerPublicId,
    variants: [],
  })
}

function adaptPublicV2DerivedRecord(record: PublicV2DerivedSkillRecord) {
  return withLegacyOwner({
    ...record,
    childDerivedSkillIds: record.childDerivedSkillIds ?? [],
    cardKeywords: record.cardKeywords ?? [],
    variants: [],
  })
}

function adaptPublicV2TalentRecord(
  record: PublicV2TalentRecord,
  upgradeTargetsByUpgrader: Map<string, {targetIds: Set<string>; patches: unknown[]}>,
) {
  return withLegacyOwner(
    applyLegacyUpgradeFields(
      {
        ...record,
        hasLevelScaledDescription: record.maxLevel !== undefined,
      },
      upgradeTargetsByUpgrader,
    ),
  )
}

function adaptPublicV2EnlightenRecord(
  record: PublicV2EnlightenRecord,
  upgradeTargetsByUpgrader: Map<string, {targetIds: Set<string>; patches: unknown[]}>,
) {
  return withLegacyOwner(applyLegacyUpgradeFields(record, upgradeTargetsByUpgrader))
}

async function loadAwakenerOwnedRecords(publicAwakenerId: string) {
  const [skills, talents, enlightens, derivedSkills, overlays] = await Promise.all([
    loadPublicV2Envelope('full', 'skills'),
    loadPublicV2Envelope('full', 'talents'),
    loadPublicV2Envelope('full', 'enlightens'),
    loadPublicV2Envelope('full', 'derived-skills'),
    loadPublicV2Envelope('full', 'overlays'),
  ])

  const ownerMatches = (record: {ownerAwakenerId?: string}): boolean =>
    record.ownerAwakenerId === publicAwakenerId

  const ownedSkills = (skills.records as PublicV2SkillRecord[]).filter(ownerMatches)
  const ownedTalents = (talents.records as PublicV2TalentRecord[]).filter(ownerMatches)
  const ownedEnlightens = (enlightens.records as PublicV2EnlightenRecord[]).filter(ownerMatches)
  const ownedDerivedSkills = (derivedSkills.records as PublicV2DerivedSkillRecord[]).filter(
    ownerMatches,
  )
  const upgradeTargetsByUpgrader = new Map<string, {targetIds: Set<string>; patches: unknown[]}>()
  for (const scope of ['skills', 'derived-skills', 'overlays'] as const) {
    const records =
      scope === 'skills'
        ? ownedSkills
        : scope === 'derived-skills'
          ? ownedDerivedSkills
          : (overlays.records as PublicV2OverlayRecord[]).filter(ownerMatches)
    for (const [upgraderId, upgrades] of collectUpgradeTargetsByUpgrader(
      records,
      upgradePatchTargetType(scope),
    )) {
      const existing = upgradeTargetsByUpgrader.get(upgraderId) ?? {
        targetIds: new Set<string>(),
        patches: [],
      }
      for (const targetId of upgrades.targetIds) {
        existing.targetIds.add(targetId)
      }
      existing.patches.push(...upgrades.patches)
      upgradeTargetsByUpgrader.set(upgraderId, existing)
    }
  }

  return {
    skills: ownedSkills,
    talents: ownedTalents,
    enlightens: ownedEnlightens,
    derivedSkills: ownedDerivedSkills,
    upgradeTargetsByUpgrader,
  }
}

async function adaptPublicV2AwakenerRecord(
  record: PublicV2AwakenerRecord,
): Promise<AwakenerFullV2Record> {
  const ownedRecords = await loadAwakenerOwnedRecords(record.id)
  const cards = {
    C1: adaptPublicV2CardRecord(requireSlotRecord(ownedRecords.skills, 'Rouse', 'skill'), record.id),
    C2: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Strike', 'skill'),
      record.id,
    ),
    C3: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Defense', 'skill'),
      record.id,
    ),
    C4: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Skill1', 'skill'),
      record.id,
    ),
    C5: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Skill2', 'skill'),
      record.id,
    ),
    Exalt: adaptPublicV2CardRecord(
      requireSlotRecord(ownedRecords.skills, 'Exalt', 'skill'),
      record.id,
    ),
    OverExalt: getSlotRecord(ownedRecords.skills, 'OverExalt')
      ? adaptPublicV2CardRecord(
          requireSlotRecord(ownedRecords.skills, 'OverExalt', 'skill'),
          record.id,
        )
      : undefined,
    promotedExtras: ownedRecords.derivedSkills
      .filter((entry) => PROMOTED_EXTRA_DERIVED_IDS.has(entry.id))
      .map(adaptPublicV2DerivedRecord),
  }

  const passiveTalents = ownedRecords.talents.filter((talent) => talent.family === 'passive')
  const talents: {
    T1: unknown
    T2: unknown
    T3: unknown
    T4: unknown
    extraTalents: unknown[]
  } = {
    T1: passiveTalents[0]
      ? adaptPublicV2TalentRecord(passiveTalents[0], ownedRecords.upgradeTargetsByUpgrader)
      : undefined,
    T2: undefined,
    T3: undefined,
    T4: undefined,
    extraTalents: passiveTalents
      .slice(1)
      .map((talent) => adaptPublicV2TalentRecord(talent, ownedRecords.upgradeTargetsByUpgrader)),
  }

  const madnessOmen = getTalentByFamily(ownedRecords.talents, 'madness_omen')
  const soulforgeAptitude = getTalentByFamily(ownedRecords.talents, 'soulforge_aptitude')
  if (madnessOmen) {
    talents.T2 = adaptPublicV2TalentRecord(madnessOmen, ownedRecords.upgradeTargetsByUpgrader)
  }
  if (soulforgeAptitude) {
    talents.T3 = adaptPublicV2TalentRecord(
      soulforgeAptitude,
      ownedRecords.upgradeTargetsByUpgrader,
    )
  }

  const adapted = {
    ...record,
    id: record.numericId,
    key:
      typeof record.assets === 'object' &&
      'portraitKey' in record.assets &&
      typeof record.assets.portraitKey === 'string'
        ? record.assets.portraitKey
        : record.id,
    displayName: record.name,
    stats: record.baseStatsLv1,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    cards,
    talents,
    enlightens: {
      E1: adaptPublicV2EnlightenRecord(
        requireSlotRecord(ownedRecords.enlightens, 'E1', 'enlighten'),
        ownedRecords.upgradeTargetsByUpgrader,
      ),
      E2: adaptPublicV2EnlightenRecord(
        requireSlotRecord(ownedRecords.enlightens, 'E2', 'enlighten'),
        ownedRecords.upgradeTargetsByUpgrader,
      ),
      E3: adaptPublicV2EnlightenRecord(
        requireSlotRecord(ownedRecords.enlightens, 'E3', 'enlighten'),
        ownedRecords.upgradeTargetsByUpgrader,
      ),
      AbsoluteAxiom: getSlotRecord(ownedRecords.enlightens, 'AbsoluteAxiom')
        ? adaptPublicV2EnlightenRecord(
            requireSlotRecord(ownedRecords.enlightens, 'AbsoluteAxiom', 'enlighten'),
            ownedRecords.upgradeTargetsByUpgrader,
          )
        : undefined,
    },
    derivedSkills: ownedRecords.derivedSkills.map(adaptPublicV2DerivedRecord),
  }

  return adapted as unknown as AwakenerFullV2Record
}

function adaptPublicV2WheelRecord(record: PublicV2WheelRecord): WheelFullV1Record {
  const rarity = record.rarity as WheelMainstatSeriesRarity
  const mainstatKey = record.mainstatKey as WheelMainstatKey
  const adapted = {
    ...record,
    aliases: record.aliases ?? [record.name],
    searchTags: record.searchTags ?? [],
    awakener: record.ownerAwakenerName,
    mainstatSeriesKey:
      record.mainstatSeriesKey ?? buildWheelMainstatSeriesKey(rarity, mainstatKey),
  }

  return adapted as unknown as WheelFullV1Record
}

export async function loadPublicV2AwakenerFullById(
  awakenerId: string | number,
): Promise<AwakenerFullV2Record | undefined> {
  const publicId = await resolvePublicAwakenerId(awakenerId)
  if (!publicId) {
    return undefined
  }

  const cachedPromise = awakenerFullByIdPromises.get(publicId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicV2FullRecord('awakeners', publicId).then((record) =>
    record ? adaptPublicV2AwakenerRecord(record as PublicV2AwakenerRecord) : undefined,
  )
  awakenerFullByIdPromises.set(publicId, recordPromise)
  return recordPromise
}

export async function loadPublicV2WheelFullById(
  wheelId: string,
): Promise<WheelFullV1Record | undefined> {
  if (!isPublicWheelId(wheelId)) {
    return undefined
  }

  const cachedPromise = wheelFullByIdPromises.get(wheelId)
  if (cachedPromise) {
    return cachedPromise
  }

  const recordPromise = loadPublicV2FullRecord('wheels', wheelId).then((record) =>
    record ? adaptPublicV2WheelRecord(record as PublicV2WheelRecord) : undefined,
  )
  wheelFullByIdPromises.set(wheelId, recordPromise)
  return recordPromise
}
