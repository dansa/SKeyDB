import {getAwakenerOverlays} from './awakener-overlays'
import {
  type AwakenerOverlayRecord,
  type DerivedSkillRecord,
  type FullStats,
} from './awakener-source-schema'
import type {
  DatabaseDescribedEntry,
  ResolvedAwakenerDatabaseReferenceLayer,
  ResolvedAwakenerDatabaseShellView,
} from './awakeners-database-view'
import {type AwakenerFullRecord} from './awakeners-full'
import {buildCardKeywordFooterText} from './card-keywords'
import {
  addDatabaseReferenceInfoToLookups,
  buildAccessibleDatabaseOverlays,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
  type DatabaseReferenceInfo,
} from './database-reference-layer'
import {getDerivedSkills} from './derived-skills'
import {resolveDescribedRecord, type DescribedRecord} from './description-records'
import {buildWheelReferenceInfoEntries} from './wheels-database-reference-layer'

type DatabaseReferenceKind = DatabaseReferenceInfo['kind']

export function collectAwakenerDatabaseCardNames(
  record: Pick<AwakenerFullRecord, 'cards' | 'talents' | 'enlightens' | 'derivedSkills'>,
  derivedSkills: DerivedSkillRecord[] = getDerivedSkills(),
): Set<string> {
  const names = new Set<string>()

  for (const card of [
    record.cards.C1,
    record.cards.C2,
    record.cards.C3,
    record.cards.C4,
    record.cards.C5,
    record.cards.Exalt,
    ...(record.cards.OverExalt ? [record.cards.OverExalt] : []),
  ]) {
    names.add(card.displayName)
  }

  for (const entry of record.cards.promotedExtras) {
    names.add(entry.displayName)
  }

  for (const entry of [
    record.talents.T1,
    record.talents.T2,
    record.talents.T3,
    record.talents.T4,
    ...record.talents.extraTalents,
  ]) {
    if (entry) {
      names.add(entry.displayName)
    }
  }

  for (const entry of [
    record.enlightens.E1,
    record.enlightens.E2,
    record.enlightens.E3,
    ...(record.enlightens.AbsoluteAxiom ? [record.enlightens.AbsoluteAxiom] : []),
  ]) {
    names.add(entry.displayName)
  }

  for (const entry of record.derivedSkills) {
    names.add(entry.displayName)
  }

  for (const entry of derivedSkills) {
    if (entry.ownerAwakenerId === undefined) {
      names.add(entry.displayName)
    }
  }

  return names
}

function buildReferenceInfoFromEntry<TRecord extends DescribedRecord>(
  kind: DatabaseReferenceKind,
  entry: DatabaseDescribedEntry<TRecord>,
  overrides: Partial<
    Pick<
      DatabaseReferenceInfo<TRecord>,
      'keywordFooterText' | 'influencingEnlightenSlots' | 'influencingTalentIds' | 'influenceBadges'
    >
  > = {},
): DatabaseReferenceInfo<TRecord> {
  return {
    kind,
    id: entry.record.id,
    name: entry.record.displayName,
    label: entry.label,
    record: entry.record,
    description: entry.resolved.description,
    keywordFooterText: entry.keywordFooterText,
    descriptionRank: entry.descriptionRank,
    descriptionMaxRank: entry.descriptionMaxRank,
    influencingEnlightenSlots: entry.influencingEnlightenSlots,
    influencingTalentIds: entry.influencingTalentIds,
    influenceBadges: entry.influenceBadges,
    ...overrides,
  }
}

function addReferenceInfoToLookups<TRecord extends DescribedRecord>(
  byName: Map<string, DatabaseReferenceInfo>,
  byId: Map<string, DatabaseReferenceInfo>,
  info: DatabaseReferenceInfo<TRecord>,
  aliases: readonly string[] = [],
): void {
  addDatabaseReferenceInfoToLookups(byName, byId, info, aliases)
}

function addDescribedReferenceInfos<TRecord extends DescribedRecord>(
  byName: Map<string, DatabaseReferenceInfo>,
  byId: Map<string, DatabaseReferenceInfo>,
  entries: DatabaseDescribedEntry<TRecord>[],
  buildInfo: (entry: DatabaseDescribedEntry<TRecord>) => DatabaseReferenceInfo<TRecord>,
): void {
  for (const entry of entries) {
    addReferenceInfoToLookups(byName, byId, buildInfo(entry))
  }
}

function getDerivedSkillLabel(record: DerivedSkillRecord): string {
  return `Derived · ${record.displayName}`
}

function buildGlobalDerivedReferenceInfo(
  record: DerivedSkillRecord,
  skillLevel: number,
  stats: FullStats | null,
): DatabaseReferenceInfo<DerivedSkillRecord> {
  const resolved = resolveDescribedRecord(record, {rank: skillLevel, stats}, {maxRank: 6, stats})
  return {
    kind: 'derived-skill',
    id: record.id,
    name: record.displayName,
    label: getDerivedSkillLabel(record),
    record,
    description: resolved.description,
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: skillLevel,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
  }
}

export {buildDatabaseOverlayLabel as buildAwakenerDatabaseOverlayLabel} from './database-reference-layer'

function buildReferenceLookups(
  shellView: ResolvedAwakenerDatabaseShellView,
  accessibleOverlays: AwakenerOverlayRecord[],
  globalDerivedSkills: DerivedSkillRecord[],
): {byId: Map<string, DatabaseReferenceInfo>; byName: Map<string, DatabaseReferenceInfo>} {
  const byName = new Map<string, DatabaseReferenceInfo>()
  const byId = new Map<string, DatabaseReferenceInfo>()

  addDescribedReferenceInfos(byName, byId, shellView.commandCards, (entry) =>
    buildReferenceInfoFromEntry('skill', entry),
  )
  addDescribedReferenceInfos(byName, byId, shellView.exalts, (entry) =>
    buildReferenceInfoFromEntry('skill', entry),
  )
  addDescribedReferenceInfos(byName, byId, shellView.talents, (entry) =>
    buildReferenceInfoFromEntry('talent', entry, {
      keywordFooterText: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }),
  )
  addDescribedReferenceInfos(byName, byId, shellView.enlightens, (entry) =>
    buildReferenceInfoFromEntry('enlighten', entry, {
      keywordFooterText: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }),
  )
  addDescribedReferenceInfos(byName, byId, shellView.derivedSkills, (entry) =>
    buildReferenceInfoFromEntry('derived-skill', entry),
  )
  addDescribedReferenceInfos(byName, byId, shellView.promotedExtras, (entry) =>
    buildReferenceInfoFromEntry('derived-skill', entry),
  )

  for (const record of globalDerivedSkills) {
    addReferenceInfoToLookups(
      byName,
      byId,
      buildGlobalDerivedReferenceInfo(record, shellView.skillLevel, shellView.stats),
    )
  }

  for (const overlay of accessibleOverlays) {
    addReferenceInfoToLookups(
      byName,
      byId,
      buildDatabaseOverlayReferenceInfo(
        overlay,
        shellView.stats,
        shellView.overlayInfluenceBadgesById[overlay.id] ?? [],
        shellView.formulaContext,
      ),
      overlay.aliases,
    )
  }

  for (const wheelInfo of buildWheelReferenceInfoEntries()) {
    addReferenceInfoToLookups(byName, byId, wheelInfo, [])
  }

  return {byId, byName}
}

export interface BuildAwakenerDatabaseReferenceLayerOptions {
  shellView: ResolvedAwakenerDatabaseShellView
  overlays?: AwakenerOverlayRecord[]
  derivedSkills?: DerivedSkillRecord[]
}

export function buildAwakenerDatabaseReferenceLayer({
  shellView,
  overlays = getAwakenerOverlays(),
  derivedSkills = getDerivedSkills(),
}: BuildAwakenerDatabaseReferenceLayerOptions): ResolvedAwakenerDatabaseReferenceLayer {
  const globalDerivedSkills = derivedSkills.filter((entry) => entry.ownerAwakenerId === undefined)
  const accessibleOverlays = buildAccessibleDatabaseOverlays(
    shellView.record.id,
    overlays,
    shellView.overlayOverridesById,
  )
  const referenceLookups = buildReferenceLookups(shellView, accessibleOverlays, globalDerivedSkills)

  return {
    cardNames: new Set([
      ...collectAwakenerDatabaseCardNames(shellView.resolvedRecord, globalDerivedSkills),
      ...buildWheelReferenceInfoEntries().map((info) => info.name),
    ]),
    accessibleOverlays,
    referenceInfoByName: referenceLookups.byName,
    referenceInfoById: referenceLookups.byId,
    overlayByName: buildDatabaseOverlayLookup(accessibleOverlays),
  }
}
