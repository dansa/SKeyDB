import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  DerivedSkillRecord,
  FullStats,
} from './awakener-source-schema'
import {buildCardKeywordFooterText} from './card-keywords'
import {resolveDescribedRecord, type DescribedRecord} from './description-records'
import type {PublicFormulaContext} from './public-formula-context'

export interface DatabaseInfluenceBadge {
  kind: 'enlighten' | 'talent'
  id: string
  label: string
  referenceName: string
  slot?: AwakenerEnlightenRecord['slot']
}

export interface DatabaseReferenceInfo<TRecord extends DescribedRecord = DescribedRecord> {
  kind:
    | 'skill'
    | 'talent'
    | 'enlighten'
    | 'derived-skill'
    | 'overlay'
    | 'wheel'
    | 'posse'
    | 'covenant'
  id: string
  name: string
  label: string
  record: TRecord
  description: string
  keywordFooterText?: string
  descriptionRank: number | undefined
  descriptionMaxRank: number | undefined
  influencingEnlightenSlots: AwakenerEnlightenRecord['slot'][]
  influencingTalentIds: string[]
  influenceBadges?: DatabaseInfluenceBadge[]
}

export interface DatabaseReferenceLayer {
  cardNames: Set<string>
  accessibleOverlays: AwakenerOverlayRecord[]
  referenceInfoByName: Map<string, DatabaseReferenceInfo>
  referenceInfoById: Map<string, DatabaseReferenceInfo>
  overlayByName: Map<string, AwakenerOverlayRecord>
}

export type ResolvedDatabaseReferenceLayer = DatabaseReferenceLayer

export function normalizeDatabaseReferenceName(name: string): string {
  return name.trim().toLowerCase()
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

export function getDatabaseDerivedSkillAliases(record: {aliases?: unknown}): readonly string[] {
  return isStringArray(record.aliases) ? record.aliases : []
}

export function addDatabaseLookupValue<T>(lookup: Map<string, T>, key: string, value: T): void {
  const normalized = normalizeDatabaseReferenceName(key)
  if (!normalized || lookup.has(normalized)) {
    return
  }

  lookup.set(normalized, value)
}

export function addDatabaseReferenceInfoById<TRecord extends DescribedRecord>(
  lookup: Map<string, DatabaseReferenceInfo>,
  info: DatabaseReferenceInfo<TRecord>,
): void {
  if (lookup.has(info.id)) {
    return
  }

  lookup.set(info.id, info)
}

export function addDatabaseReferenceInfoToLookups<TRecord extends DescribedRecord>(
  byName: Map<string, DatabaseReferenceInfo>,
  byId: Map<string, DatabaseReferenceInfo>,
  info: DatabaseReferenceInfo<TRecord>,
  aliases: readonly string[] = [],
): void {
  addDatabaseLookupValue(byName, info.name, info)
  addDatabaseReferenceInfoById(byId, info)
  for (const alias of aliases) {
    addDatabaseLookupValue(byName, alias, info)
  }
}

export class DatabaseReferenceLookupAccumulator {
  readonly referenceInfoByName = new Map<string, DatabaseReferenceInfo>()
  readonly referenceInfoById = new Map<string, DatabaseReferenceInfo>()

  add<TRecord extends DescribedRecord>(
    info: DatabaseReferenceInfo<TRecord>,
    aliases: readonly string[] = [],
  ): void {
    addDatabaseReferenceInfoToLookups(
      this.referenceInfoByName,
      this.referenceInfoById,
      info,
      aliases,
    )
  }

  addMany(
    infos: readonly DatabaseReferenceInfo[],
    getAliases: (info: DatabaseReferenceInfo, index: number) => readonly string[] = () => [],
  ): void {
    infos.forEach((info, index) => {
      this.add(info, getAliases(info, index))
    })
  }

  toLookups(): {
    byName: Map<string, DatabaseReferenceInfo>
    byId: Map<string, DatabaseReferenceInfo>
  } {
    return {
      byName: this.referenceInfoByName,
      byId: this.referenceInfoById,
    }
  }
}

export function buildDatabaseOverlayLabel(overlay: AwakenerOverlayRecord): string {
  return `${overlay.overlayType.charAt(0).toUpperCase()}${overlay.overlayType.slice(1)}`
}

export function buildAccessibleDatabaseOverlays(
  ownerAwakenerId: number | string | undefined,
  overlays: AwakenerOverlayRecord[],
  overlayOverridesById: Record<string, AwakenerOverlayRecord> = {},
): AwakenerOverlayRecord[] {
  const numericOwnerAwakenerId =
    typeof ownerAwakenerId === 'string'
      ? Number(/^awakener-(\d{4})$/.exec(ownerAwakenerId)?.[1] ?? 0)
      : ownerAwakenerId
  const accessible = overlays.filter(
    (overlay) =>
      overlay.ownerAwakenerId === undefined || overlay.ownerAwakenerId === numericOwnerAwakenerId,
  )

  return accessible.map((overlay) => overlayOverridesById[overlay.id] ?? overlay)
}

export function buildDatabaseOverlayLookup(
  overlays: AwakenerOverlayRecord[],
): Map<string, AwakenerOverlayRecord> {
  const lookup = new Map<string, AwakenerOverlayRecord>()

  for (const overlay of overlays) {
    addDatabaseLookupValue(lookup, overlay.displayName, overlay)
    for (const alias of overlay.aliases) {
      addDatabaseLookupValue(lookup, alias, overlay)
    }
  }

  return lookup
}

export function buildDatabaseOverlayReferenceInfo(
  overlay: AwakenerOverlayRecord,
  stats: FullStats | null = null,
  influenceBadges: DatabaseInfluenceBadge[] = [],
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<AwakenerOverlayRecord> {
  const resolved = resolveDescribedRecord(overlay, {stats, formulaContext}, {stats, formulaContext})
  const influencingEnlightenSlots = influenceBadges.flatMap((badge) =>
    badge.kind === 'enlighten' && badge.slot ? [badge.slot] : [],
  )
  const influencingTalentIds = influenceBadges.flatMap((badge) =>
    badge.kind === 'talent' ? [badge.id] : [],
  )

  return {
    kind: 'overlay',
    id: overlay.id,
    name: overlay.displayName,
    label: buildDatabaseOverlayLabel(overlay),
    record: overlay,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots,
    influencingTalentIds,
    influenceBadges,
  }
}

export interface BuildDatabaseDerivedSkillReferenceInfoOptions {
  label?: string
  rank?: number
  maxRank?: number
  stats?: FullStats | null
}

export function buildDatabaseDerivedSkillReferenceInfo(
  record: DerivedSkillRecord,
  formulaContext?: PublicFormulaContext,
  {
    label = `Derived · ${record.displayName}`,
    rank = 1,
    maxRank = 6,
    stats = null,
  }: BuildDatabaseDerivedSkillReferenceInfoOptions = {},
): DatabaseReferenceInfo<DerivedSkillRecord> {
  const resolved = resolveDescribedRecord(
    record,
    {rank, stats, formulaContext},
    {maxRank, stats, formulaContext},
  )

  return {
    kind: 'derived-skill',
    id: record.id,
    name: record.displayName,
    label,
    record,
    description: resolved.description,
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: rank,
    descriptionMaxRank: maxRank,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}
