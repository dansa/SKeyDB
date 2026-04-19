import {getAwakenerOverlays} from './awakener-overlays'
import {
  ENLIGHTEN_SLOT_KEYS,
  type AwakenerEnlightenRecord,
  type AwakenerOverlayRecord,
  type AwakenerSkillRecord,
  type AwakenerTalentRecord,
  type DerivedSkillRecord,
  type FullStats,
} from './awakener-source-schema'
import {buildAwakenerDatabaseReferenceLayer} from './awakeners-database-reference-layer'
import {type AwakenerFullV2Record} from './awakeners-full-v2'
import {isSoulforgeTalent} from './awakeners-full-v2-contract'
import {
  resolveAwakenerFullV2Record,
  type AwakenerFullV2ResolveOptions,
  type ResolvedAwakenerFullV2Record,
} from './awakeners-full-v2-resolver'
import {buildCardKeywordFooterText} from './card-keywords'
import type {
  DatabaseInfluenceBadge,
  ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'
import {getDerivedSkills} from './derived-skills'
import {
  resolveDescribedRecord,
  type DescribedRecord,
  type ResolvedDescribedRecord,
} from './description-records'

export {collectAwakenerDatabaseCardNames} from './awakeners-database-reference-layer'
export type {
  DatabaseInfluenceBadge,
  DatabaseReferenceInfo,
  DatabaseReferenceLayer,
  ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'

export interface AwakenerDatabaseViewOptions extends Partial<
  Pick<AwakenerFullV2ResolveOptions, 'selectedEnlightenSlot' | 'soulforgeLevel'>
> {
  skillLevel?: number
  stats?: FullStats | null
}

export interface DatabaseDescribedEntry<TRecord extends DescribedRecord> {
  key: string
  label: string
  record: TRecord
  resolved: ResolvedDescribedRecord<TRecord>
  keywordFooterText?: string
  descriptionRank: number | undefined
  descriptionMaxRank: number | undefined
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][]
  influencingTalentIds: string[]
  influenceBadges?: DatabaseInfluenceBadge[]
}

export interface ResolvedAwakenerDatabaseShellView {
  selection: ResolvedAwakenerFullV2Record['selection']
  skillLevel: number
  stats: FullStats | null
  activeEnlightenIds: string[]
  record: AwakenerFullV2Record
  resolvedRecord: ResolvedAwakenerFullV2Record['record']
  overlayOverridesById: Record<string, AwakenerOverlayRecord>
  commandCards: DatabaseDescribedEntry<AwakenerSkillRecord>[]
  exalts: DatabaseDescribedEntry<AwakenerSkillRecord>[]
  talents: DatabaseDescribedEntry<AwakenerTalentRecord>[]
  enlightens: DatabaseDescribedEntry<AwakenerEnlightenRecord>[]
  derivedSkills: DatabaseDescribedEntry<DerivedSkillRecord>[]
  promotedExtras: DatabaseDescribedEntry<DerivedSkillRecord>[]
}

export type ResolvedAwakenerDatabaseReferenceLayer = ResolvedDatabaseReferenceLayer

export type ResolvedAwakenerDatabaseView = ResolvedAwakenerDatabaseShellView &
  ResolvedAwakenerDatabaseReferenceLayer

function resolveSkillEntry(
  key: string,
  label: string,
  record: AwakenerSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][],
  influencingTalentIds: string[],
  influenceBadges: DatabaseInfluenceBadge[] = [],
): DatabaseDescribedEntry<AwakenerSkillRecord> {
  return resolveRankedEntry(
    key,
    label,
    record,
    skillLevel,
    stats,
    influencingEnlightenSlots,
    influencingTalentIds,
    influenceBadges,
  )
}

function resolveRankedEntry<TRecord extends AwakenerSkillRecord | DerivedSkillRecord>(
  key: string,
  label: string,
  record: TRecord,
  skillLevel: number,
  stats: FullStats | null,
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][] = [],
  influencingTalentIds: string[] = [],
  influenceBadges: DatabaseInfluenceBadge[] = [],
): DatabaseDescribedEntry<TRecord> {
  return {
    key,
    label,
    record,
    resolved: resolveDescribedRecord(record, {rank: skillLevel, stats}, {maxRank: 6, stats}),
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: skillLevel,
    descriptionMaxRank: 6,
    influencingEnlightenSlots,
    influencingTalentIds,
    influenceBadges,
  }
}

function resolveTalentEntry(
  key: string,
  label: string,
  record: AwakenerTalentRecord,
  stats: FullStats | null,
  soulforgeLevel: number | undefined,
): DatabaseDescribedEntry<AwakenerTalentRecord> {
  const rank = resolveTalentRank(record, soulforgeLevel)
  return {
    key,
    label,
    record,
    resolved: resolveDescribedRecord(record, {rank, stats}, {maxRank: record.maxLevel, stats}),
    keywordFooterText: undefined,
    descriptionRank: rank,
    descriptionMaxRank: record.maxLevel,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function resolveEnlightenEntry(
  key: string,
  label: string,
  record: AwakenerEnlightenRecord,
  stats: FullStats | null,
): DatabaseDescribedEntry<AwakenerEnlightenRecord> {
  return {
    key,
    label,
    record,
    resolved: resolveDescribedRecord(record, {stats}, {stats}),
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function formatCardLabel(name: string, cost: string | undefined): string {
  return `Card · ${name} · Cost ${cost ?? '—'}`
}

function getDerivedSkillLabel(skill: DerivedSkillRecord): string {
  return skill.nodeKind === 'group'
    ? 'Card · Derived Group'
    : formatCardLabel('Derived', skill.cost)
}

function resolveTalentRank(
  record: AwakenerTalentRecord,
  soulforgeLevel: number | undefined,
): number {
  const hasScaledDescription = record.hasLevelScaledDescription ?? (record.maxLevel ?? 1) > 1
  if (!hasScaledDescription) {
    return 1
  }

  const maxLevel = record.maxLevel ?? 1
  if (!isSoulforgeTalent(record)) {
    return maxLevel
  }

  if (soulforgeLevel === undefined) {
    return maxLevel
  }

  return Math.max(1, Math.min(maxLevel, Math.floor(soulforgeLevel)))
}

interface DatabaseEntryInfluenceLookups {
  enlightenByTargetId: Map<string, AwakenerEnlightenRecord['slot'][]>
  talentByTargetId: Map<string, string[]>
}

interface DatabaseInfluenceBadgeLookups {
  enlightenBadgeBySlot: Map<AwakenerEnlightenRecord['slot'], DatabaseInfluenceBadge>
  talentBadgeById: Map<string, DatabaseInfluenceBadge>
}

interface DatabaseEntryInfluences {
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][]
  influencingTalentIds: string[]
  influenceBadges: DatabaseInfluenceBadge[]
}

function getInfluenceBadgeLabel(slot: AwakenerEnlightenRecord['slot']): string {
  return slot === 'AbsoluteAxiom' ? 'AA' : slot
}

function buildDatabaseInfluenceBadgeLookups(
  talents: DatabaseDescribedEntry<AwakenerTalentRecord>[],
  enlightens: DatabaseDescribedEntry<AwakenerEnlightenRecord>[],
): DatabaseInfluenceBadgeLookups {
  const talentBadgeById = new Map<string, DatabaseInfluenceBadge>()
  const enlightenBadgeBySlot = new Map<AwakenerEnlightenRecord['slot'], DatabaseInfluenceBadge>()

  for (const talent of talents) {
    if (!/^T[1-4]$/.test(talent.key)) {
      continue
    }

    talentBadgeById.set(talent.record.id, {
      kind: 'talent',
      id: talent.record.id,
      label: talent.key,
      referenceName: talent.record.displayName,
    })
  }

  for (const enlighten of enlightens) {
    enlightenBadgeBySlot.set(enlighten.record.slot, {
      kind: 'enlighten',
      id: enlighten.record.id,
      label: getInfluenceBadgeLabel(enlighten.record.slot),
      referenceName: enlighten.record.displayName,
      slot: enlighten.record.slot,
    })
  }

  return {enlightenBadgeBySlot, talentBadgeById}
}

function buildDatabaseInfluenceBadges(
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][],
  influencingTalentIds: string[],
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseInfluenceBadge[] {
  return [
    ...influencingEnlightenSlots.flatMap((slot) => {
      const badge = badgeLookups.enlightenBadgeBySlot.get(slot)
      return badge ? [badge] : []
    }),
    ...influencingTalentIds.flatMap((id) => {
      const badge = badgeLookups.talentBadgeById.get(id)
      return badge ? [badge] : []
    }),
  ]
}

function resolveEntryInfluences(
  targetId: string,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseEntryInfluences {
  const influencingEnlightenSlots = lookups.enlightenByTargetId.get(targetId) ?? []
  const influencingTalentIds = lookups.talentByTargetId.get(targetId) ?? []

  return {
    influencingEnlightenSlots,
    influencingTalentIds,
    influenceBadges: buildDatabaseInfluenceBadges(
      influencingEnlightenSlots,
      influencingTalentIds,
      badgeLookups,
    ),
  }
}

function resolveSkillEntryWithInfluences(
  key: string,
  label: string,
  record: AwakenerSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseDescribedEntry<AwakenerSkillRecord> {
  const influences = resolveEntryInfluences(record.id, lookups, badgeLookups)

  return resolveSkillEntry(
    key,
    label,
    record,
    skillLevel,
    stats,
    influences.influencingEnlightenSlots,
    influences.influencingTalentIds,
    influences.influenceBadges,
  )
}

function resolveDerivedEntryWithInfluences(
  key: string,
  record: DerivedSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseDescribedEntry<DerivedSkillRecord> {
  const influences = resolveEntryInfluences(record.id, lookups, badgeLookups)

  return resolveRankedEntry(
    key,
    getDerivedSkillLabel(record),
    record,
    skillLevel,
    stats,
    influences.influencingEnlightenSlots,
    influences.influencingTalentIds,
    influences.influenceBadges,
  )
}

const COMMAND_CARD_SPECS = [
  {key: 'C1', name: 'Rouse'},
  {key: 'C2', name: 'C2'},
  {key: 'C3', name: 'C3'},
  {key: 'C4', name: 'C4'},
  {key: 'C5', name: 'C5'},
] as const

function buildCommandCardEntries(
  cards: AwakenerFullV2Record['cards'],
  skillLevel: number,
  stats: FullStats | null,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseDescribedEntry<AwakenerSkillRecord>[] {
  return COMMAND_CARD_SPECS.map(({key, name}) =>
    resolveSkillEntryWithInfluences(
      key,
      formatCardLabel(name, cards[key].cost),
      cards[key],
      skillLevel,
      stats,
      lookups,
      badgeLookups,
    ),
  )
}

function buildExaltEntries(
  cards: AwakenerFullV2Record['cards'],
  skillLevel: number,
  stats: FullStats | null,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseDescribedEntry<AwakenerSkillRecord>[] {
  const exalts = [
    resolveSkillEntryWithInfluences(
      'Exalt',
      formatCardLabel('Exalt', cards.Exalt.cost),
      cards.Exalt,
      skillLevel,
      stats,
      lookups,
      badgeLookups,
    ),
  ]

  if (cards.OverExalt) {
    exalts.push(
      resolveSkillEntryWithInfluences(
        'OverExalt',
        formatCardLabel('Over Exalt', cards.OverExalt.cost),
        cards.OverExalt,
        skillLevel,
        stats,
        lookups,
        badgeLookups,
      ),
    )
  }

  return exalts
}

const TALENT_SLOT_KEYS = ['T1', 'T2', 'T3', 'T4'] as const

function buildTalentEntries(
  talents: AwakenerFullV2Record['talents'],
  stats: FullStats | null,
  soulforgeLevel: number | undefined,
): DatabaseDescribedEntry<AwakenerTalentRecord>[] {
  const entries: DatabaseDescribedEntry<AwakenerTalentRecord>[] = []

  for (const key of TALENT_SLOT_KEYS) {
    const record = talents[key]
    if (!record) {
      continue
    }

    entries.push(resolveTalentEntry(key, `Talent · ${key}`, record, stats, soulforgeLevel))
  }

  for (const [index, entry] of talents.extraTalents.entries()) {
    entries.push(
      resolveTalentEntry(
        `extra:${entry.id}`,
        `Talent · Extra ${String(index + 1)}`,
        entry,
        stats,
        soulforgeLevel,
      ),
    )
  }

  return entries
}

function buildEnlightenEntries(
  enlightens: AwakenerFullV2Record['enlightens'],
  stats: FullStats | null,
): DatabaseDescribedEntry<AwakenerEnlightenRecord>[] {
  const entries = [
    resolveEnlightenEntry('E1', 'Enlighten · E1', enlightens.E1, stats),
    resolveEnlightenEntry('E2', 'Enlighten · E2', enlightens.E2, stats),
    resolveEnlightenEntry('E3', 'Enlighten · E3', enlightens.E3, stats),
  ]

  if (enlightens.AbsoluteAxiom) {
    entries.push(
      resolveEnlightenEntry('AbsoluteAxiom', 'Final Rule', enlightens.AbsoluteAxiom, stats),
    )
  }

  return entries
}

function buildDerivedEntries(
  keyPrefix: 'promoted' | 'derived',
  records: DerivedSkillRecord[],
  skillLevel: number,
  stats: FullStats | null,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseDescribedEntry<DerivedSkillRecord>[] {
  return records.map((record) =>
    resolveDerivedEntryWithInfluences(
      `${keyPrefix}:${record.id}`,
      record,
      skillLevel,
      stats,
      lookups,
      badgeLookups,
    ),
  )
}

function buildEnlightenInfluenceByTargetId(
  record: AwakenerFullV2Record,
): Map<string, AwakenerEnlightenRecord['slot'][]> {
  const influenceByTargetId = new Map<string, AwakenerEnlightenRecord['slot'][]>()

  for (const slot of ENLIGHTEN_SLOT_KEYS) {
    const enlighten =
      slot === 'AbsoluteAxiom' ? record.enlightens.AbsoluteAxiom : record.enlightens[slot]

    if (!enlighten) {
      continue
    }

    for (const targetId of enlighten.upgradeTargetIds) {
      const existing = influenceByTargetId.get(targetId) ?? []
      if (!existing.includes(slot)) {
        existing.push(slot)
        influenceByTargetId.set(targetId, existing)
      }
    }

    for (const patch of enlighten.upgradePatches) {
      const existing = influenceByTargetId.get(patch.targetId) ?? []
      if (!existing.includes(slot)) {
        existing.push(slot)
        influenceByTargetId.set(patch.targetId, existing)
      }
    }
  }

  return influenceByTargetId
}

function buildTalentInfluenceByTargetId(record: AwakenerFullV2Record): Map<string, string[]> {
  const influenceByTargetId = new Map<string, string[]>()

  for (const talent of [
    record.talents.T1,
    record.talents.T2,
    record.talents.T3,
    record.talents.T4,
    ...record.talents.extraTalents,
  ]) {
    if (!talent) {
      continue
    }

    for (const patch of talent.upgradePatches) {
      const existing = influenceByTargetId.get(patch.targetId) ?? []
      if (!existing.includes(talent.id)) {
        existing.push(talent.id)
        influenceByTargetId.set(patch.targetId, existing)
      }
    }
  }

  return influenceByTargetId
}

export function resolveAwakenerDatabaseView(
  record: AwakenerFullV2Record,
  options: AwakenerDatabaseViewOptions = {},
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
  derivedSkills: DerivedSkillRecord[] = getDerivedSkills(),
): ResolvedAwakenerDatabaseView {
  const shellView = resolveAwakenerDatabaseShellView(record, options, overlays)
  const referenceLayer = buildAwakenerDatabaseReferenceLayer({
    shellView,
    overlays,
    derivedSkills,
  })

  return {
    ...shellView,
    ...referenceLayer,
  }
}

export function resolveAwakenerDatabaseShellView(
  record: AwakenerFullV2Record,
  options: AwakenerDatabaseViewOptions = {},
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
): ResolvedAwakenerDatabaseShellView {
  const skillLevel = Math.max(1, Math.floor(options.skillLevel ?? 1))
  const stats = options.stats ?? null
  const resolvedRecord = resolveAwakenerFullV2Record(
    record,
    {
      selectedEnlightenSlot: options.selectedEnlightenSlot,
      soulforgeLevel: options.soulforgeLevel,
    },
    overlays,
  )
  const resolvedAwakenerRecord = resolvedRecord.record
  const influenceLookups = {
    enlightenByTargetId: buildEnlightenInfluenceByTargetId(record),
    talentByTargetId: buildTalentInfluenceByTargetId(record),
  }
  const talents = buildTalentEntries(
    resolvedAwakenerRecord.talents,
    stats,
    resolvedRecord.selection.soulforgeLevel,
  )
  const enlightens = buildEnlightenEntries(resolvedAwakenerRecord.enlightens, stats)
  const influenceBadgeLookups = buildDatabaseInfluenceBadgeLookups(talents, enlightens)

  const commandCards = buildCommandCardEntries(
    resolvedAwakenerRecord.cards,
    skillLevel,
    stats,
    influenceLookups,
    influenceBadgeLookups,
  )
  const exalts = buildExaltEntries(
    resolvedAwakenerRecord.cards,
    skillLevel,
    stats,
    influenceLookups,
    influenceBadgeLookups,
  )
  const promotedExtras = buildDerivedEntries(
    'promoted',
    resolvedAwakenerRecord.cards.promotedExtras,
    skillLevel,
    stats,
    influenceLookups,
    influenceBadgeLookups,
  )
  const ownedDerivedSkills = buildDerivedEntries(
    'derived',
    resolvedAwakenerRecord.derivedSkills,
    skillLevel,
    stats,
    influenceLookups,
    influenceBadgeLookups,
  )

  return {
    selection: resolvedRecord.selection,
    skillLevel,
    stats,
    activeEnlightenIds: resolvedRecord.activeEnlightenIds,
    record,
    resolvedRecord: resolvedRecord.record,
    overlayOverridesById: resolvedRecord.overlayOverridesById,
    commandCards,
    exalts,
    talents,
    enlightens,
    derivedSkills: ownedDerivedSkills,
    promotedExtras,
  }
}
