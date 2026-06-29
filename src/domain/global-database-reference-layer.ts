import {getAwakenerOverlays} from './awakener-overlays'
import {getAwakenerSkills} from './awakener-skills'
import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  AwakenerSkillRecord,
  AwakenerTalentRecord,
  DerivedSkillRecord,
  FullStats,
} from './awakener-source-schema'
import {buildCardKeywordFooterText} from './card-keywords'
import {getCovenants, type Covenant} from './covenants'
import type {CovenantFullRecord} from './covenants-full'
import {
  buildDatabaseDerivedSkillReferenceInfo,
  buildDatabaseOverlayLookup,
  buildDatabaseOverlayReferenceInfo,
  DatabaseReferenceLookupAccumulator,
  getDatabaseDerivedSkillAliases,
  type DatabaseReferenceInfo,
  type ResolvedDatabaseReferenceLayer,
} from './database-reference-layer'
import {getDerivedSkills} from './derived-skills'
import {
  resolveDescribedRecord,
  type CovenantDatabaseDescriptionRecord,
  type PosseDatabaseDescriptionRecord,
  type WheelDatabaseDescriptionRecord,
} from './description-records'
import {getPosses, type Posse} from './posses'
import type {PosseFullRecord} from './posses-full'
import type {PublicFormulaContext} from './public-formula-context'
import {getRealmLabel} from './realms'
import {getWheels, type Wheel} from './wheels'
import {buildWheelDatabaseDescriptionRecord} from './wheels-database-reference-layer'

type ArtifactDescriptionRecord =
  | WheelDatabaseDescriptionRecord
  | PosseDatabaseDescriptionRecord
  | CovenantDatabaseDescriptionRecord

export function buildPosseDatabaseDescriptionRecord(
  record: Pick<
    PosseFullRecord,
    'id' | 'name' | 'ownerAwakenerId' | 'descriptionTemplate' | 'descriptionArgs'
  >,
): PosseDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'posse',
    displayName: record.name,
    ownerAwakenerId: record.ownerAwakenerId,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

export function buildCovenantDatabaseDescriptionRecord(record: {
  id: string
  name: string
  descriptionTemplate: string
  descriptionArgs: CovenantDatabaseDescriptionRecord['descriptionArgs']
}): CovenantDatabaseDescriptionRecord {
  return {
    id: record.id,
    kind: 'covenant',
    displayName: record.name,
    descriptionTemplate: record.descriptionTemplate,
    descriptionArgs: record.descriptionArgs,
  }
}

function buildArtifactReferenceInfo(
  record: ArtifactDescriptionRecord,
  label: string,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<ArtifactDescriptionRecord> {
  const resolved = resolveDescribedRecord(record, {formulaContext}, {formulaContext})

  return {
    kind: record.kind,
    id: record.id,
    name: record.displayName,
    label,
    record,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildArtifactReferenceStub(
  record: ArtifactDescriptionRecord,
  label: string,
): DatabaseReferenceInfo<ArtifactDescriptionRecord> {
  return {
    kind: record.kind,
    id: record.id,
    name: record.displayName,
    label,
    record,
    description: '',
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildCovenantSetEffectReferenceInfo(
  record: CovenantFullRecord,
  label: string,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<ArtifactDescriptionRecord> | null {
  const setInfos = record.setEffects.map((setEffect) => ({
    label: `${setEffect.set.toString()} Set`,
    info: buildArtifactReferenceInfo(
      buildCovenantDatabaseDescriptionRecord({
        id: `${record.id}:${setEffect.set.toString()}`,
        name: record.name,
        descriptionTemplate: setEffect.descriptionTemplate,
        descriptionArgs: setEffect.descriptionArgs,
      }),
      `Covenant · ${setEffect.set.toString()} Set`,
      formulaContext,
    ),
  }))

  if (setInfos.length === 0) {
    return null
  }

  const description = setInfos
    .map(({info, label: setLabel}) => `${setLabel}: ${info.description}`)
    .join('\n\n')

  return {
    ...setInfos[0].info,
    id: record.id,
    name: record.name,
    label,
    record: buildCovenantDatabaseDescriptionRecord({
      id: record.id,
      name: record.name,
      descriptionTemplate: description,
      descriptionArgs: {},
    }),
    description,
  }
}

function buildAwakenerSkillReferenceInfo(
  record: AwakenerSkillRecord,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<AwakenerSkillRecord> {
  const resolved = resolveDescribedRecord(
    record,
    {rank: 1, formulaContext},
    {maxRank: 6, formulaContext},
  )

  return {
    kind: 'skill',
    id: record.id,
    name: record.displayName,
    label: record.displayName,
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

function buildAwakenerTalentReferenceInfo(
  record: AwakenerTalentRecord,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<AwakenerTalentRecord> {
  const resolved = resolveDescribedRecord(
    record,
    {rank: record.maxLevel ?? 1, formulaContext},
    {maxRank: record.maxLevel, formulaContext},
  )

  return {
    kind: 'talent',
    id: record.id,
    name: record.displayName,
    label: `Talent · ${record.displayName}`,
    record,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: record.maxLevel ?? 1,
    descriptionMaxRank: record.maxLevel,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildAwakenerEnlightenReferenceInfo(
  record: AwakenerEnlightenRecord,
  formulaContext?: PublicFormulaContext,
): DatabaseReferenceInfo<AwakenerEnlightenRecord> {
  const resolved = resolveDescribedRecord(record, {formulaContext}, {formulaContext})

  return {
    kind: 'enlighten',
    id: record.id,
    name: record.displayName,
    label: `Enlighten · ${record.slot}`,
    record,
    description: resolved.description,
    keywordFooterText: undefined,
    descriptionRank: undefined,
    descriptionMaxRank: undefined,
    influencingEnlightenSlots: [],
    influencingTalentIds: [],
    influenceBadges: [],
  }
}

function buildOverlayNameSet(overlays: AwakenerOverlayRecord[]): Set<string> {
  const names = new Set<string>()
  for (const overlay of overlays) {
    names.add(overlay.displayName.toLowerCase())
    for (const alias of overlay.aliases) {
      names.add(alias.toLowerCase())
    }
  }
  return names
}

function buildPosseReferenceEntries(
  records: Posse[],
): DatabaseReferenceInfo<ArtifactDescriptionRecord>[] {
  return records.map((record) =>
    buildArtifactReferenceStub(
      {
        id: record.id,
        kind: 'posse',
        displayName: record.name,
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      `Posse · ${getRealmLabel(record.realm)}`,
    ),
  )
}

function buildCovenantReferenceEntries(
  records: Covenant[],
): DatabaseReferenceInfo<ArtifactDescriptionRecord>[] {
  return records.map((record) =>
    buildArtifactReferenceStub(
      {
        id: record.id,
        kind: 'covenant',
        displayName: record.name,
        descriptionTemplate: '',
        descriptionArgs: {},
      },
      'Covenant',
    ),
  )
}

function buildWheelReferenceEntries(
  records: Wheel[],
): DatabaseReferenceInfo<ArtifactDescriptionRecord>[] {
  return records.map((record) =>
    buildArtifactReferenceStub(
      buildWheelDatabaseDescriptionRecord({
        id: record.id,
        name: record.name,
        ownerAwakenerId: record.ownerAwakenerId,
        descriptionTemplate: '',
        descriptionArgs: {},
      }),
      `Wheel · ${record.rarity} · ${getRealmLabel(record.realm)}`,
    ),
  )
}

export interface BuildGlobalDatabaseReferenceLayerOptions {
  formulaContext?: PublicFormulaContext
  overlays?: AwakenerOverlayRecord[]
  derivedSkills?: DerivedSkillRecord[]
  awakenerSkills?: AwakenerSkillRecord[]
  posses?: Posse[]
  covenants?: Covenant[]
  wheels?: Wheel[]
  extraReferences?: {record: ArtifactDescriptionRecord; label: string}[]
}

export function buildGlobalDatabaseReferenceLayer({
  awakenerSkills = getAwakenerSkills(),
  covenants = getCovenants(),
  derivedSkills = getDerivedSkills(),
  extraReferences = [],
  formulaContext,
  overlays = getAwakenerOverlays(),
  posses = getPosses(),
  wheels = getWheels(),
}: BuildGlobalDatabaseReferenceLayerOptions = {}): ResolvedDatabaseReferenceLayer {
  const referenceInfos = new DatabaseReferenceLookupAccumulator()
  const overlayNameSet = buildOverlayNameSet(overlays)
  const referencedDerivedSkills = derivedSkills.filter(
    (entry) => !overlayNameSet.has(entry.displayName.toLowerCase()),
  )
  const referencedAwakenerSkills = awakenerSkills.filter(
    (entry) => !overlayNameSet.has(entry.displayName.toLowerCase()),
  )
  const extraReferenceInfos = extraReferences.map((entry) =>
    buildArtifactReferenceInfo(entry.record, entry.label, formulaContext),
  )
  const wheelInfos = buildWheelReferenceEntries(wheels)
  const posseInfos = buildPosseReferenceEntries(posses)
  const covenantInfos = buildCovenantReferenceEntries(covenants)

  referenceInfos.addMany([...extraReferenceInfos, ...wheelInfos, ...posseInfos, ...covenantInfos])

  for (const record of referencedDerivedSkills) {
    referenceInfos.add(
      buildDatabaseDerivedSkillReferenceInfo(record, formulaContext),
      getDatabaseDerivedSkillAliases(record),
    )
  }

  referenceInfos.addMany(
    referencedAwakenerSkills.map((record) =>
      buildAwakenerSkillReferenceInfo(record, formulaContext),
    ),
  )

  for (const overlay of overlays) {
    referenceInfos.add(
      buildDatabaseOverlayReferenceInfo(overlay, null, [], formulaContext),
      overlay.aliases,
    )
  }

  return {
    cardNames: new Set([
      ...extraReferenceInfos.map((info) => info.name),
      ...wheelInfos.map((info) => info.name),
      ...posseInfos.map((info) => info.name),
      ...covenantInfos.map((info) => info.name),
      ...referencedDerivedSkills.map((entry) => entry.displayName),
      ...referencedDerivedSkills.flatMap((entry) => getDatabaseDerivedSkillAliases(entry)),
      ...referencedAwakenerSkills.map((entry) => entry.displayName),
    ]),
    accessibleOverlays: overlays,
    referenceInfoByName: referenceInfos.referenceInfoByName,
    referenceInfoById: referenceInfos.referenceInfoById,
    overlayByName: buildDatabaseOverlayLookup(overlays),
  }
}

export async function hydrateGlobalDatabaseReferenceInfo(
  info: DatabaseReferenceInfo,
  formulaContext?: PublicFormulaContext,
  stats: FullStats | null = null,
): Promise<DatabaseReferenceInfo> {
  if (info.description) {
    return info
  }

  if (info.kind === 'skill') {
    const {loadPublicSkillDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicSkillDetailById(info.id)
    return record ? buildAwakenerSkillReferenceInfo(record, formulaContext) : info
  }

  if (info.kind === 'talent') {
    const {loadPublicTalentDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicTalentDetailById(info.id)
    return record ? buildAwakenerTalentReferenceInfo(record, formulaContext) : info
  }

  if (info.kind === 'enlighten') {
    const {loadPublicEnlightenDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicEnlightenDetailById(info.id)
    return record ? buildAwakenerEnlightenReferenceInfo(record, formulaContext) : info
  }

  if (info.kind === 'derived-skill') {
    const {loadPublicDerivedSkillDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicDerivedSkillDetailById(info.id)
    return record ? buildDatabaseDerivedSkillReferenceInfo(record, formulaContext) : info
  }

  if (info.kind === 'overlay') {
    const {loadPublicOverlayDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicOverlayDetailById(info.id)
    return record
      ? buildDatabaseOverlayReferenceInfo(record, stats, info.influenceBadges ?? [], formulaContext)
      : info
  }

  if (info.kind === 'wheel') {
    const {loadPublicWheelDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicWheelDetailById(info.id)
    if (!record) {
      return info
    }
    return buildArtifactReferenceInfo(
      buildWheelDatabaseDescriptionRecord(record),
      info.label,
      formulaContext,
    )
  }

  if (info.kind === 'posse') {
    const {loadPublicPosseDetailById} = await import('./public-detail-record-adapters')
    const record = await loadPublicPosseDetailById(info.id)
    if (!record) {
      return info
    }
    return buildArtifactReferenceInfo(
      buildPosseDatabaseDescriptionRecord(record),
      info.label,
      formulaContext,
    )
  }

  const {loadPublicCovenantDetailById} = await import('./public-detail-record-adapters')
  const record = await loadPublicCovenantDetailById(info.id)
  if (!record) {
    return info
  }

  return buildCovenantSetEffectReferenceInfo(record, info.label, formulaContext) ?? info
}
