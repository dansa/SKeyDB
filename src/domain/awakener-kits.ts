import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

import {awakenerKitsDatasetSchema, type AwakenerKitRecord} from './awakener-source-schema'
import {numericAwakenerId} from './public-v3-awakener-record-adapters'

const publicOwnedRecordSchema = z.object({
  id: z.string(),
  ownerAwakenerId: z.string(),
  slot: z.string().optional(),
  family: z.string().optional(),
})

const publicOwnedRecordsSchema = z.array(publicOwnedRecordSchema)

type PublicOwnedRecord = z.infer<typeof publicOwnedRecordSchema>

let awakenerKitsCache: AwakenerKitRecord[] | null = null

function requireOwnedRecord(records: PublicOwnedRecord[], slot: string, ownerId: string): string {
  const record = records.find((entry) => entry.ownerAwakenerId === ownerId && entry.slot === slot)
  if (!record) {
    throw new Error(`Missing public kit record for ${ownerId} slot ${slot}.`)
  }
  return record.id
}

function optionalOwnedRecord(
  records: PublicOwnedRecord[],
  slot: string,
  ownerId: string,
): string | undefined {
  return records.find((entry) => entry.ownerAwakenerId === ownerId && entry.slot === slot)?.id
}

function adaptPublicAwakenerToKit(record: {id: string; numericId: number}): AwakenerKitRecord {
  const skills = publicOwnedRecordsSchema.parse(getPublicCatalogRecords('skills'))
  const talents = publicOwnedRecordsSchema.parse(getPublicCatalogRecords('talents'))
  const enlightens = publicOwnedRecordsSchema.parse(getPublicCatalogRecords('enlightens'))
  const ownerTalents = talents.filter((entry) => entry.ownerAwakenerId === record.id)
  const passiveTalents = ownerTalents.filter((entry) => entry.family === 'passive')

  const overExaltCardId = optionalOwnedRecord(skills, 'OverExalt', record.id)
  const absoluteAxiomId = optionalOwnedRecord(enlightens, 'AbsoluteAxiom', record.id)
  const overExaltEnlightenId = optionalOwnedRecord(enlightens, 'OverExalt', record.id)
  const firstPassiveTalentId = passiveTalents[0]?.id
  const madnessOmenTalentId = ownerTalents.find((entry) => entry.family === 'madness_omen')?.id
  const soulforgeTalentId = ownerTalents.find((entry) => entry.family === 'soulforge_aptitude')?.id
  const gnosticPotentialTalentId = ownerTalents.find(
    (entry) => entry.family === 'gnostic_potential',
  )?.id
  const secondPassiveTalentId = passiveTalents[1]?.id
  const fourthTalentId = gnosticPotentialTalentId ?? secondPassiveTalentId
  const extraPassiveTalentIds = passiveTalents
    .slice(gnosticPotentialTalentId ? 1 : 2)
    .map((entry) => entry.id)

  return {
    awakenerId: record.numericId,
    cards: {
      C1: requireOwnedRecord(skills, 'Rouse', record.id),
      C2: requireOwnedRecord(skills, 'Strike', record.id),
      C3: requireOwnedRecord(skills, 'Defense', record.id),
      C4: requireOwnedRecord(skills, 'Skill1', record.id),
      C5: requireOwnedRecord(skills, 'Skill2', record.id),
      Exalt: requireOwnedRecord(skills, 'Exalt', record.id),
      ...(overExaltCardId ? {OverExalt: overExaltCardId} : {}),
      promotedExtras: [],
    },
    talents: {
      ...(firstPassiveTalentId ? {T1: firstPassiveTalentId} : {}),
      ...(madnessOmenTalentId ? {T2: madnessOmenTalentId} : {}),
      ...(soulforgeTalentId ? {T3: soulforgeTalentId} : {}),
      ...(fourthTalentId ? {T4: fourthTalentId} : {}),
      extraTalentIds: extraPassiveTalentIds,
    },
    enlightens: {
      E1: requireOwnedRecord(enlightens, 'E1', record.id),
      E2: requireOwnedRecord(enlightens, 'E2', record.id),
      E3: requireOwnedRecord(enlightens, 'E3', record.id),
      ...(overExaltEnlightenId ? {OverExalt: overExaltEnlightenId} : {}),
      ...(absoluteAxiomId ? {AbsoluteAxiom: absoluteAxiomId} : {}),
    },
  }
}

export function getAwakenerKits(): AwakenerKitRecord[] {
  if (awakenerKitsCache) {
    return awakenerKitsCache
  }

  const kitRecords: AwakenerKitRecord[] = []
  for (const record of getPublicCatalogRecords('awakeners')) {
    kitRecords.push(
      adaptPublicAwakenerToKit({
        id: record.id,
        numericId:
          typeof record.numericId === 'number' ? record.numericId : numericAwakenerId(record.id),
      }),
    )
  }

  awakenerKitsCache = awakenerKitsDatasetSchema.parse(kitRecords)
  return awakenerKitsCache
}

export function getAwakenerKitById(
  awakenerId: number,
  kits: AwakenerKitRecord[],
): AwakenerKitRecord | undefined {
  return kits.find((entry) => entry.awakenerId === awakenerId)
}
