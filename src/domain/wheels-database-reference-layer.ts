import {getAwakenerOverlays} from './awakener-overlays'
import type {AwakenerOverlayRecord} from './awakener-source-schema'
import {
  addDatabaseReferenceInfoToLookups,
  buildAccessibleDatabaseOverlays,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'
import {resolveDescribedRecord, type WheelDatabaseDescriptionRecord} from './description-records'
import {getRealmLabel} from './factions'
import {getWheelsFullV1, type WheelFullV1Record} from './wheels-full-v1'

export function buildWheelDatabaseDescriptionRecord(
  record: WheelFullV1Record,
): WheelDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'wheel',
    displayName: record.name,
    ownerAwakenerId: record.ownerAwakenerId,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

function buildWheelReferenceInfo(
  record: WheelFullV1Record,
  descriptionRank: number,
): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord> {
  const describedRecord = buildWheelDatabaseDescriptionRecord(record)
  const resolved = resolveDescribedRecord(describedRecord, {rank: descriptionRank})

  return {
    kind: 'wheel',
    id: record.id,
    name: record.name,
    label: `Wheel · ${record.rarity} · ${getRealmLabel(record.realm)}`,
    record: describedRecord,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank,
    descriptionMaxRank: 4,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

interface BuildWheelReferenceInfoEntriesOptions {
  wheelRecords?: WheelFullV1Record[]
  activeWheelId?: string
  activeDescriptionRank?: number
}

export function buildWheelReferenceInfoEntries({
  activeDescriptionRank = 1,
  activeWheelId,
  wheelRecords = getWheelsFullV1(),
}: BuildWheelReferenceInfoEntriesOptions = {}): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>[] {
  return wheelRecords.map((record) =>
    buildWheelReferenceInfo(
      record,
      activeWheelId && record.id === activeWheelId ? activeDescriptionRank : 1,
    ),
  )
}

interface BuildWheelDatabaseReferenceLayerOptions extends BuildWheelReferenceInfoEntriesOptions {
  overlays?: AwakenerOverlayRecord[]
}

export function buildWheelDatabaseReferenceLayer({
  activeDescriptionRank = 1,
  activeWheelId,
  overlays = getAwakenerOverlays(),
  wheelRecords = getWheelsFullV1(),
}: BuildWheelDatabaseReferenceLayerOptions = {}): ResolvedDatabaseReferenceLayer {
  const referenceInfoByName = new Map<string, DatabaseReferenceInfo>()
  const referenceInfoById = new Map<string, DatabaseReferenceInfo>()
  const wheelInfos = buildWheelReferenceInfoEntries({
    activeDescriptionRank,
    activeWheelId,
    wheelRecords,
  })
  const activeWheel = wheelRecords.find((record) => record.id === activeWheelId)
  const accessibleOverlays = buildAccessibleDatabaseOverlays(activeWheel?.ownerAwakenerId, overlays)
  const overlayByName = buildDatabaseOverlayLookup(accessibleOverlays)

  wheelInfos.forEach((info, index) => {
    const sourceRecord = wheelRecords[index]
    addDatabaseReferenceInfoToLookups(
      referenceInfoByName,
      referenceInfoById,
      info,
      sourceRecord.aliases,
    )
  })

  for (const overlay of accessibleOverlays) {
    const overlayInfo = buildDatabaseOverlayReferenceInfo(overlay)
    addDatabaseReferenceInfoToLookups(
      referenceInfoByName,
      referenceInfoById,
      overlayInfo,
      overlay.aliases,
    )
  }

  return {
    cardNames: new Set(wheelInfos.map((info) => info.name)),
    accessibleOverlays,
    referenceInfoByName,
    referenceInfoById,
    overlayByName,
  }
}
