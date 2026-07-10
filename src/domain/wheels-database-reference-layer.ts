import {getAwakenerOverlays} from './awakener-overlays'
import type {AwakenerOverlayRecord, DerivedSkillRecord} from './awakener-source-schema'
import {
  buildAccessibleDatabaseOverlays,
  buildDatabaseDerivedSkillReferenceInfo,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
  DatabaseReferenceLookupAccumulator,
  getDatabaseDerivedSkillAliases,
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'
import {getDerivedSkills} from './derived-skills'
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

let defaultWheelReferenceInfoEntriesCache:
  | DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>[]
  | null = null

export function buildWheelReferenceInfoEntries({
  activeDescriptionRank = 1,
  activeWheelId,
  formulaContext,
  wheelRecords,
}: BuildWheelReferenceInfoEntriesOptions = {}): DatabaseReferenceInfo<WheelDatabaseDescriptionRecord>[] {
  if (!activeWheelId && !formulaContext && activeDescriptionRank === 1 && !wheelRecords) {
    defaultWheelReferenceInfoEntriesCache ??= getWheelsFull().map((record) =>
      buildWheelReferenceInfo(record, 1),
    )
    return defaultWheelReferenceInfoEntriesCache
  }

  const resolvedWheelRecords = wheelRecords ?? getWheelsFull()
  return resolvedWheelRecords.map((record) =>
    buildWheelReferenceInfo(
      record,
      activeWheelId && record.id === activeWheelId ? activeDescriptionRank : 1,
      activeWheelId && record.id === activeWheelId ? formulaContext : undefined,
    ),
  )
}

interface BuildWheelDatabaseReferenceLayerOptions extends BuildWheelReferenceInfoEntriesOptions {
  derivedSkills?: DerivedSkillRecord[]
  overlays?: AwakenerOverlayRecord[]
}

export function buildWheelDatabaseReferenceLayer({
  activeDescriptionRank = 1,
  activeWheelId,
  derivedSkills = getDerivedSkills(),
  formulaContext,
  overlays = getAwakenerOverlays(),
  wheelRecords = getWheelsFull(),
}: BuildWheelDatabaseReferenceLayerOptions = {}): ResolvedDatabaseReferenceLayer {
  const referenceInfos = new DatabaseReferenceLookupAccumulator()
  const wheelInfos = buildWheelReferenceInfoEntries({
    activeDescriptionRank,
    activeWheelId,
    formulaContext,
    wheelRecords,
  })
  const activeWheel = wheelRecords.find((record) => record.id === activeWheelId)
  const accessibleOverlays = buildAccessibleDatabaseOverlays(activeWheel?.ownerAwakenerId, overlays)
  const overlayByName = buildDatabaseOverlayLookup(accessibleOverlays)
  const globalDerivedSkillInfos = derivedSkills
    .filter((record) => record.ownerAwakenerId === undefined)
    .map((record) => buildDatabaseDerivedSkillReferenceInfo(record, formulaContext))

  wheelInfos.forEach((info, index) => {
    const sourceRecord = wheelRecords[index]
    referenceInfos.add(info, sourceRecord.aliases)
  })

  for (const overlay of accessibleOverlays) {
    const overlayInfo = buildDatabaseOverlayReferenceInfo(overlay, null, [], formulaContext)
    referenceInfos.add(overlayInfo, overlay.aliases)
  }

  for (const info of globalDerivedSkillInfos) {
    referenceInfos.add(info, getDatabaseDerivedSkillAliases(info.record))
  }

  return {
    cardNames: new Set([
      ...wheelInfos.map((info) => info.name),
      ...globalDerivedSkillInfos.map((info) => info.name),
      ...globalDerivedSkillInfos.flatMap((info) => getDatabaseDerivedSkillAliases(info.record)),
    ]),
    accessibleOverlays,
    referenceInfoByName: referenceInfos.referenceInfoByName,
    referenceInfoById: referenceInfos.referenceInfoById,
    overlayByName,
  }
}
