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
import type {PublicFormulaContext} from './public-formula-context'
import {getRealmLabel} from './realms'
import {getWheelsFull, type WheelFullRecord} from './wheels-full'

export function buildWheelDatabaseDescriptionRecord(record: {
  id: string
  name: string
  ownerAwakenerId?: string
  descriptionTemplate: string
  descriptionArgs: WheelFullRecord['descriptionArgs']
}): WheelDatabaseDescriptionRecord {
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
  record: WheelFullRecord,
  descriptionRank: number,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord> {
  const describedRecord = buildWheelDatabaseDescriptionRecord(record)
  const resolved = resolveDescribedRecord(describedRecord, {rank: descriptionRank, formulaContext})

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
  wheelRecords?: WheelFullRecord[]
  activeWheelId?: string
  activeDescriptionRank?: number
  formulaContext?: PublicFormulaContext
}

export function buildWheelReferenceInfoEntries({
  activeDescriptionRank = 1,
  activeWheelId,
  formulaContext,
  wheelRecords = getWheelsFull(),
}: BuildWheelReferenceInfoEntriesOptions = {}): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>[] {
  return wheelRecords.map((record) =>
    buildWheelReferenceInfo(
      record,
      activeWheelId && record.id === activeWheelId ? activeDescriptionRank : 1,
      activeWheelId && record.id === activeWheelId ? formulaContext : undefined,
    ),
  )
}

interface BuildWheelDatabaseReferenceLayerOptions extends BuildWheelReferenceInfoEntriesOptions {
  overlays?: AwakenerOverlayRecord[]
}

export function buildWheelDatabaseReferenceLayer({
  activeDescriptionRank = 1,
  activeWheelId,
  formulaContext,
  overlays = getAwakenerOverlays(),
  wheelRecords = getWheelsFull(),
}: BuildWheelDatabaseReferenceLayerOptions = {}): ResolvedDatabaseReferenceLayer {
  const referenceInfoByName = new Map<string, DatabaseReferenceInfo>()
  const referenceInfoById = new Map<string, DatabaseReferenceInfo>()
  const wheelInfos = buildWheelReferenceInfoEntries({
    activeDescriptionRank,
    activeWheelId,
    formulaContext,
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
    const overlayInfo = buildDatabaseOverlayReferenceInfo(overlay, null, [], formulaContext)
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
