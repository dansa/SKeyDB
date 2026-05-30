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
import {type AwakenerFullRecord} from './awakeners-full'
import {isGnosticPotentialTalent, isSoulforgeTalent} from './awakeners-full-contract'
import {
  resolveAwakenerFullRecord,
  type AwakenerFullResolveOptions,
  type ResolvedAwakenerFullRecord,
} from './awakeners-full-resolver'
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
import type {PublicFormulaContext} from './public-formula-context'

export {collectAwakenerDatabaseCardNames} from './awakeners-database-reference-layer'
export type {
  DatabaseInfluenceBadge,
  DatabaseReferenceInfo,
  DatabaseReferenceLayer,
  ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'

export interface AwakenerDatabaseViewOptions extends Partial<
  Pick<
    AwakenerFullResolveOptions,
    'selectedEnlightenSlot' | 'soulforgeLevel' | 'gnosticPotentialLevel'
  >
> {
  skillLevel?: number
  stats?: FullStats | null
  formulaContext?: PublicFormulaContext
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
  selection: ResolvedAwakenerFullRecord['selection']
  skillLevel: number
  stats: FullStats | null
  formulaContext?: PublicFormulaContext
  activeEnlightenIds: string[]
  record: AwakenerFullRecord
  resolvedRecord: ResolvedAwakenerFullRecord['record']
  overlayOverridesById: Record<string, AwakenerOverlayRecord>
  overlayInfluenceBadgesById: Record<string, DatabaseInfluenceBadge[]>
  commandCards: DatabaseDescribedEntry<AwakenerSkillRecord>[]
  exalts: DatabaseDescribedEntry<AwakenerSkillRecord>[]
  overExalt: DatabaseDescribedEntry<AwakenerSkillRecord> | null
  talents: DatabaseDescribedEntry<AwakenerTalentRecord>[]
  enlightens: DatabaseDescribedEntry<AwakenerEnlightenRecord>[]
  derivedSkills: DatabaseDescribedEntry<DerivedSkillRecord>[]
  promotedExtras: DatabaseDescribedEntry<DerivedSkillRecord>[]
}

export type ResolvedAwakenerDatabaseReferenceLayer = ResolvedDatabaseReferenceLayer

function isAwakenerEnlightenSlot(value: unknown): value is AwakenerEnlightenRecord['slot'] {
  return typeof value === 'string' && (ENLIGHTEN_SLOT_KEYS as readonly string[]).includes(value)
}

export type ResolvedAwakenerDatabaseView = ResolvedAwakenerDatabaseShellView &
  ResolvedAwakenerDatabaseReferenceLayer

function resolveSkillEntry(
  key: string,
  label: string,
  record: AwakenerSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
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
    formulaContext,
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
  formulaContext: PublicFormulaContext | undefined,
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][] = [],
  influencingTalentIds: string[] = [],
  influenceBadges: DatabaseInfluenceBadge[] = [],
): DatabaseDescribedEntry<TRecord> {
  return {
    key,
    label,
    record,
    resolved: resolveDescribedRecord(
      record,
      {rank: skillLevel, stats, formulaContext},
      {maxRank: 6, stats, formulaContext},
    ),
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
  formulaContext: PublicFormulaContext | undefined,
  soulforgeLevel: number | undefined,
  gnosticPotentialLevel: number | undefined,
): DatabaseDescribedEntry<AwakenerTalentRecord> {
  const rank = resolveTalentRank(record, soulforgeLevel, gnosticPotentialLevel)
  const displayRecord =
    rank <= 0 && isGnosticPotentialTalent(record) ? zeroTalentRecord(record) : record
  return {
    key,
    label,
    record: displayRecord,
    resolved: resolveDescribedRecord(
      displayRecord,
      {rank, stats, formulaContext},
      {maxRank: displayRecord.maxLevel, stats, formulaContext},
    ),
    keywordFooterText: undefined,
    descriptionRank: rank,
    descriptionMaxRank: displayRecord.maxLevel,
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
  formulaContext: PublicFormulaContext | undefined,
): DatabaseDescribedEntry<AwakenerEnlightenRecord> {
  return {
    key,
    label,
    record,
    resolved: resolveDescribedRecord(record, {stats, formulaContext}, {stats, formulaContext}),
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
  gnosticPotentialLevel: number | undefined,
): number {
  const hasScaledDescription = record.hasLevelScaledDescription ?? (record.maxLevel ?? 1) > 1
  if (!hasScaledDescription) {
    return 1
  }

  const maxLevel = record.maxLevel ?? 1
  if (!isSoulforgeTalent(record)) {
    if (!isGnosticPotentialTalent(record)) {
      return maxLevel
    }

    if (record.defaultMaxed) {
      return maxLevel
    }

    if (gnosticPotentialLevel === undefined) {
      return 0
    }

    return Math.max(0, Math.min(maxLevel, Math.floor(gnosticPotentialLevel)))
  }

  if (soulforgeLevel === undefined) {
    return maxLevel
  }

  return Math.max(1, Math.min(maxLevel, Math.floor(soulforgeLevel)))
}

function zeroTalentRecord(record: AwakenerTalentRecord): AwakenerTalentRecord {
  return {
    ...record,
    descriptionArgs: Object.fromEntries(
      Object.entries(record.descriptionArgs).map(([key, arg]) => [
        key,
        {
          kind: 'fixed',
          value: '0',
          ...('channel' in arg && arg.channel ? {channel: arg.channel} : {}),
          ...('suffix' in arg && arg.suffix ? {suffix: arg.suffix} : {}),
          ...('stat' in arg && arg.stat ? {stat: arg.stat} : {}),
        },
      ]),
    ),
  }
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

function buildOverlayInfluenceBadgesById(
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): Record<string, DatabaseInfluenceBadge[]> {
  const overlayIds = new Set<string>()

  for (const id of lookups.enlightenByTargetId.keys()) {
    if (id.startsWith('overlay.')) {
      overlayIds.add(id)
    }
  }

  for (const id of lookups.talentByTargetId.keys()) {
    if (id.startsWith('overlay.')) {
      overlayIds.add(id)
    }
  }

  return Object.fromEntries(
    [...overlayIds].map((id) => [
      id,
      resolveEntryInfluences(id, lookups, badgeLookups).influenceBadges,
    ]),
  )
}

function resolveSkillEntryWithInfluences(
  key: string,
  label: string,
  record: AwakenerSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
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
    formulaContext,
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
  formulaContext: PublicFormulaContext | undefined,
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
    formulaContext,
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
  cards: AwakenerFullRecord['cards'],
  skillLevel: number,
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
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
      formulaContext,
      lookups,
      badgeLookups,
    ),
  )
}

function buildExaltEntries(
  cards: AwakenerFullRecord['cards'],
  skillLevel: number,
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
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
      formulaContext,
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
        formulaContext,
        lookups,
        badgeLookups,
      ),
    )
  }

  return exalts
}

const TALENT_SLOT_KEYS = ['T1', 'T2', 'T3', 'T4'] as const

function buildTalentEntries(
  talents: AwakenerFullRecord['talents'],
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
  soulforgeLevel: number | undefined,
  gnosticPotentialLevel: number | undefined,
): DatabaseDescribedEntry<AwakenerTalentRecord>[] {
  const entries: DatabaseDescribedEntry<AwakenerTalentRecord>[] = []

  for (const key of TALENT_SLOT_KEYS) {
    const record = talents[key]
    if (!record) {
      continue
    }

    entries.push(
      resolveTalentEntry(
        key,
        `Talent · ${key}`,
        record,
        stats,
        formulaContext,
        soulforgeLevel,
        gnosticPotentialLevel,
      ),
    )
  }

  for (const [index, entry] of talents.extraTalents.entries()) {
    entries.push(
      resolveTalentEntry(
        `extra:${entry.id}`,
        `Talent · Extra ${String(index + 1)}`,
        entry,
        stats,
        formulaContext,
        soulforgeLevel,
        gnosticPotentialLevel,
      ),
    )
  }

  return entries
}

function buildEnlightenEntries(
  enlightens: AwakenerFullRecord['enlightens'],
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
): DatabaseDescribedEntry<AwakenerEnlightenRecord>[] {
  const entries = [
    resolveEnlightenEntry('E1', 'Enlighten · E1', enlightens.E1, stats, formulaContext),
    resolveEnlightenEntry('E2', 'Enlighten · E2', enlightens.E2, stats, formulaContext),
    resolveEnlightenEntry('E3', 'Enlighten · E3', enlightens.E3, stats, formulaContext),
  ]

  if (enlightens.AbsoluteAxiom) {
    entries.push(
      resolveEnlightenEntry(
        'AbsoluteAxiom',
        'Absolute Axiom',
        enlightens.AbsoluteAxiom,
        stats,
        formulaContext,
      ),
    )
  }

  return entries
}

function buildDerivedEntries(
  keyPrefix: 'promoted' | 'derived',
  records: DerivedSkillRecord[],
  skillLevel: number,
  stats: FullStats | null,
  formulaContext: PublicFormulaContext | undefined,
  lookups: DatabaseEntryInfluenceLookups,
  badgeLookups: DatabaseInfluenceBadgeLookups,
): DatabaseDescribedEntry<DerivedSkillRecord>[] {
  return records.map((record) =>
    resolveDerivedEntryWithInfluences(
      `${keyPrefix}:${record.id}`,
      record,
      skillLevel,
      stats,
      formulaContext,
      lookups,
      badgeLookups,
    ),
  )
}

function buildEnlightenInfluenceByTargetId(
  record: AwakenerFullRecord,
): Map<string, AwakenerEnlightenRecord['slot'][]> {
  const influenceByTargetId = new Map<string, AwakenerEnlightenRecord['slot'][]>()
  const influenceSlotSetByTargetId = new Map<string, Set<AwakenerEnlightenRecord['slot']>>()

  const slotByEnlightenId = new Map<string, AwakenerEnlightenRecord['slot']>()

  for (const slot of ENLIGHTEN_SLOT_KEYS) {
    const enlighten =
      slot === 'AbsoluteAxiom' ? record.enlightens.AbsoluteAxiom : record.enlightens[slot]
    if (enlighten) {
      slotByEnlightenId.set(enlighten.id, slot)
    }
  }

  for (const target of getPublicUpgradeTargets(record)) {
    for (const upgrade of target.upgrades ?? []) {
      if (upgrade.upgraderType !== 'enlighten') {
        continue
      }
      if (typeof upgrade.upgraderId !== 'string') {
        continue
      }
      const slotCandidate = slotByEnlightenId.get(upgrade.upgraderId) ?? upgrade.upgraderSlot
      if (!isAwakenerEnlightenSlot(slotCandidate)) {
        continue
      }
      const slot = slotCandidate
      const existing = influenceByTargetId.get(target.id) ?? []
      const existingSlots = influenceSlotSetByTargetId.get(target.id) ?? new Set()
      if (!existingSlots.has(slot)) {
        existing.push(slot)
        existingSlots.add(slot)
        influenceByTargetId.set(target.id, existing)
        influenceSlotSetByTargetId.set(target.id, existingSlots)
      }
    }
  }

  return influenceByTargetId
}

function buildTalentInfluenceByTargetId(record: AwakenerFullRecord): Map<string, string[]> {
  const influenceByTargetId = new Map<string, string[]>()
  const influenceTalentSetByTargetId = new Map<string, Set<string>>()
  const talentIds = new Set(
    [
      record.talents.T1,
      record.talents.T2,
      record.talents.T3,
      record.talents.T4,
      ...record.talents.extraTalents,
    ].flatMap((talent) => (talent ? [talent.id] : [])),
  )

  for (const target of getPublicUpgradeTargets(record)) {
    for (const upgrade of target.upgrades ?? []) {
      if (
        upgrade.upgraderType !== 'talent' ||
        typeof upgrade.upgraderId !== 'string' ||
        !talentIds.has(upgrade.upgraderId)
      ) {
        continue
      }
      const existing = influenceByTargetId.get(target.id) ?? []
      const existingTalentIds = influenceTalentSetByTargetId.get(target.id) ?? new Set()
      if (!existingTalentIds.has(upgrade.upgraderId)) {
        existing.push(upgrade.upgraderId)
        existingTalentIds.add(upgrade.upgraderId)
        influenceByTargetId.set(target.id, existing)
        influenceTalentSetByTargetId.set(target.id, existingTalentIds)
      }
    }
  }

  return influenceByTargetId
}

function getPublicUpgradeTargets(
  record: AwakenerFullRecord,
): {id: string; upgrades?: AwakenerFullRecord['cards']['C1']['upgrades']}[] {
  return [
    record.cards.C1,
    record.cards.C2,
    record.cards.C3,
    record.cards.C4,
    record.cards.C5,
    record.cards.Exalt,
    ...(record.cards.OverExalt ? [record.cards.OverExalt] : []),
    ...record.cards.promotedExtras,
    ...record.derivedSkills,
    ...(record.overlays ?? []),
  ]
}

export function resolveAwakenerDatabaseView(
  record: AwakenerFullRecord,
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
  record: AwakenerFullRecord,
  options: AwakenerDatabaseViewOptions = {},
  overlays: AwakenerOverlayRecord[] = getAwakenerOverlays(),
): ResolvedAwakenerDatabaseShellView {
  const skillLevel = Math.max(1, Math.floor(options.skillLevel ?? 1))
  const stats = options.stats ?? null
  const formulaContext = options.formulaContext
  const resolvedRecord = resolveAwakenerFullRecord(
    record,
    {
      selectedEnlightenSlot: options.selectedEnlightenSlot,
      soulforgeLevel: options.soulforgeLevel,
      gnosticPotentialLevel: options.gnosticPotentialLevel,
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
    formulaContext,
    resolvedRecord.selection.soulforgeLevel,
    resolvedRecord.selection.gnosticPotentialLevel,
  )
  const enlightens = buildEnlightenEntries(resolvedAwakenerRecord.enlightens, stats, formulaContext)
  const influenceBadgeLookups = buildDatabaseInfluenceBadgeLookups(talents, enlightens)

  const commandCards = buildCommandCardEntries(
    resolvedAwakenerRecord.cards,
    skillLevel,
    stats,
    formulaContext,
    influenceLookups,
    influenceBadgeLookups,
  )
  const exalts = buildExaltEntries(
    resolvedAwakenerRecord.cards,
    skillLevel,
    stats,
    formulaContext,
    influenceLookups,
    influenceBadgeLookups,
  )
  const overExalt = exalts.find((entry) => entry.key === 'OverExalt') ?? null
  const promotedExtras = buildDerivedEntries(
    'promoted',
    resolvedAwakenerRecord.cards.promotedExtras,
    skillLevel,
    stats,
    formulaContext,
    influenceLookups,
    influenceBadgeLookups,
  )
  const ownedDerivedSkills = buildDerivedEntries(
    'derived',
    resolvedAwakenerRecord.derivedSkills,
    skillLevel,
    stats,
    formulaContext,
    influenceLookups,
    influenceBadgeLookups,
  )

  return {
    selection: resolvedRecord.selection,
    skillLevel,
    stats,
    formulaContext,
    activeEnlightenIds: resolvedRecord.activeEnlightenIds,
    record,
    resolvedRecord: resolvedRecord.record,
    overlayOverridesById: resolvedRecord.overlayOverridesById,
    overlayInfluenceBadgesById: buildOverlayInfluenceBadgesById(
      influenceLookups,
      influenceBadgeLookups,
    ),
    commandCards,
    exalts,
    overExalt,
    talents,
    enlightens,
    derivedSkills: ownedDerivedSkills,
    promotedExtras,
  }
}
