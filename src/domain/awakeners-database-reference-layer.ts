import {getAwakenerOverlays} from './awakener-overlays'
import {type AwakenerOverlayRecord, type DerivedSkillRecord} from './awakener-source-schema'
import type {
  DatabaseDescribedEntry,
  ResolvedAwakenerDatabaseReferenceLayer,
  ResolvedAwakenerDatabaseShellView,
} from './awakeners-database-view'
import {type AwakenerFullRecord} from './awakeners-full'
import {
  buildAccessibleDatabaseOverlays,
  buildDatabaseDerivedSkillReferenceInfo,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
  DatabaseReferenceLookupAccumulator,
  type DatabaseReferenceInfo,
} from './database-reference-layer'
import {getDerivedSkills} from './derived-skills'
import {type DescribedRecord} from './description-records'
import {buildWheelReferenceInfoEntries} from './wheels-database-reference-layer'

type DatabaseReferenceKind = DatabaseReferenceInfo['kind']

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

function getDerivedAliases(record: {aliases?: unknown}): readonly string[] {
  return isStringArray(record.aliases) ? record.aliases : []
}

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
    for (const alias of getDerivedAliases(entry)) {
      names.add(alias)
    }
  }

  for (const entry of derivedSkills) {
    if (entry.ownerAwakenerId === undefined) {
      names.add(entry.displayName)
      for (const alias of getDerivedAliases(entry)) {
        names.add(alias)
      }
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

function addDescribedReferenceInfos<TRecord extends DescribedRecord>(
  accumulator: DatabaseReferenceLookupAccumulator,
  entries: DatabaseDescribedEntry<TRecord>[],
  buildInfo: (entry: DatabaseDescribedEntry<TRecord>) => DatabaseReferenceInfo<TRecord>,
): void {
  for (const entry of entries) {
    accumulator.add(buildInfo(entry))
  }
}

function getDerivedSkillLabel(record: DerivedSkillRecord): string {
  return `Derived · ${record.displayName}`
}

export {buildDatabaseOverlayLabel as buildAwakenerDatabaseOverlayLabel} from './database-reference-layer'

function buildReferenceLookups(
  shellView: ResolvedAwakenerDatabaseShellView,
  accessibleOverlays: AwakenerOverlayRecord[],
  globalDerivedSkills: DerivedSkillRecord[],
  wheelReferenceInfos: DatabaseReferenceInfo[],
): {byId: Map<string, DatabaseReferenceInfo>; byName: Map<string, DatabaseReferenceInfo>} {
  const accumulator = new DatabaseReferenceLookupAccumulator()

  addDescribedReferenceInfos(accumulator, shellView.commandCards, (entry) =>
    buildReferenceInfoFromEntry('skill', entry),
  )
  addDescribedReferenceInfos(accumulator, shellView.exalts, (entry) =>
    buildReferenceInfoFromEntry('skill', entry),
  )
  addDescribedReferenceInfos(accumulator, shellView.talents, (entry) =>
    buildReferenceInfoFromEntry('talent', entry, {
      keywordFooterText: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }),
  )
  addDescribedReferenceInfos(accumulator, shellView.enlightens, (entry) =>
    buildReferenceInfoFromEntry('enlighten', entry, {
      keywordFooterText: undefined,
      influencingEnlightenSlots: [],
      influencingTalentIds: [],
      influenceBadges: [],
    }),
  )
  for (const entry of shellView.derivedSkills) {
    accumulator.add(
      buildReferenceInfoFromEntry('derived-skill', entry),
      getDerivedAliases(entry.record),
    )
  }
  for (const entry of shellView.promotedExtras) {
    accumulator.add(
      buildReferenceInfoFromEntry('derived-skill', entry),
      getDerivedAliases(entry.record),
    )
  }

  for (const record of globalDerivedSkills) {
    accumulator.add(
      buildDatabaseDerivedSkillReferenceInfo(record, shellView.formulaContext, {
        label: getDerivedSkillLabel(record),
        rank: shellView.skillLevel,
        stats: shellView.stats,
      }),
      getDerivedAliases(record),
    )
  }

  for (const overlay of accessibleOverlays) {
    accumulator.add(
      buildDatabaseOverlayReferenceInfo(
        overlay,
        shellView.stats,
        shellView.overlayInfluenceBadgesById[overlay.id] ?? [],
        shellView.formulaContext,
      ),
      overlay.aliases,
    )
  }

  for (const wheelInfo of wheelReferenceInfos) {
    accumulator.add(wheelInfo)
  }

  return accumulator.toLookups()
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
  const wheelReferenceInfos = buildWheelReferenceInfoEntries()
  const referenceLookups = buildReferenceLookups(
    shellView,
    accessibleOverlays,
    globalDerivedSkills,
    wheelReferenceInfos,
  )

  return {
    cardNames: new Set([
      ...collectAwakenerDatabaseCardNames(shellView.resolvedRecord, globalDerivedSkills),
      ...wheelReferenceInfos.map((info) => info.name),
    ]),
    accessibleOverlays,
    referenceInfoByName: referenceLookups.byName,
    referenceInfoById: referenceLookups.byId,
    overlayByName: buildDatabaseOverlayLookup(accessibleOverlays),
  }
}
