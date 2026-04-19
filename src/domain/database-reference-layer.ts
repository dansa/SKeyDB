import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  FullStats,
} from './awakener-source-schema'
import {resolveDescribedRecord, type DescribedRecord} from './description-records'

export interface DatabaseInfluenceBadge {
  kind: 'enlighten' | 'talent'
  id: string
  label: string
  referenceName: string
  slot?: AwakenerEnlightenRecord['slot']
}

export interface DatabaseReferenceInfo<TRecord extends DescribedRecord = DescribedRecord> {
  kind: 'skill' | 'talent' | 'enlighten' | 'derived-skill' | 'overlay' | 'wheel'
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

export function buildDatabaseOverlayLabel(overlay: AwakenerOverlayRecord): string {
  return `${overlay.overlayType.charAt(0).toUpperCase()}${overlay.overlayType.slice(1)}`
}

export function buildAccessibleDatabaseOverlays(
  ownerAwakenerId: number | undefined,
  overlays: AwakenerOverlayRecord[],
  overlayOverridesById: Record<string, AwakenerOverlayRecord> = {},
): AwakenerOverlayRecord[] {
  const accessible = overlays.filter(
    (overlay) =>
      overlay.ownerAwakenerId === undefined || overlay.ownerAwakenerId === ownerAwakenerId,
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
): DatabaseReferenceInfo<AwakenerOverlayRecord> {
  const resolved = resolveDescribedRecord(overlay, {stats}, {stats})
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
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}
