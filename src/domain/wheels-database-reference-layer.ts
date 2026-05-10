import {getAwakenerOverlays} from './awakener-overlays'
import type {AwakenerOverlayRecord, DerivedSkillRecord} from './awakener-source-schema'
import {buildCardKeywordFooterText} from './card-keywords'
import {
  addDatabaseReferenceInfoToLookups,
  buildAccessibleDatabaseOverlays,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
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

function buildDerivedSkillReferenceInfo(
  record: DerivedSkillRecord,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<DerivedSkillRecord> {
  const resolved = resolveDescribedRecord(
    record,
    {rank: 1, formulaContext},
    {maxRank: 6, formulaContext},
  )

  return {
    kind: 'derived-skill',
    id: record.id,
    name: record.displayName,
    label: `Derived · ${record.displayName}`,
    record,
    description: resolved.description,
    keywordFooterText: buildCardKeywordFooterText(record.cardKeywords),
    descriptionRank: 1,
    descriptionMaxRank: 6,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
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
  const globalDerivedSkillInfos = derivedSkills
    .filter((record) => record.ownerAwakenerId === undefined)
    .map((record) => buildDerivedSkillReferenceInfo(record, formulaContext))

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

  for (const info of globalDerivedSkillInfos) {
    addDatabaseReferenceInfoToLookups(referenceInfoByName, referenceInfoById, info)
  }

  return {
    cardNames: new Set([
      ...wheelInfos.map((info) => info.name),
      ...globalDerivedSkillInfos.map((info) => info.name),
    ]),
    accessibleOverlays,
    referenceInfoByName,
    referenceInfoById,
    overlayByName,
  }
}
