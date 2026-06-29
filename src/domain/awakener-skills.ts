import {getPublicSkillCatalogRecords} from '@/data-access/public-data/catalogScopes/skillsCatalog'

import {awakenerSkillsDatasetSchema, type AwakenerSkillRecord} from './awakener-source-schema'
import {
  adaptPublicV3SkillRecord,
  numericAwakenerId,
  parsePublicV3SkillCatalogRecord,
  type PublicV3SkillRecord,
} from './public-v3-awakener-record-adapters'

let awakenerSkillsCache: AwakenerSkillRecord[] | null = null

const skillSlotOrder = new Map([
  ['Rouse', 0],
  ['Strike', 1],
  ['Defense', 2],
  ['Skill1', 3],
  ['Skill2', 4],
  ['Exalt', 5],
  ['OverExalt', 6],
])

function comparePublicSkillRecords(left: PublicV3SkillRecord, right: PublicV3SkillRecord): number {
  const ownerOrder =
    numericAwakenerId(left.ownerAwakenerId ?? '') - numericAwakenerId(right.ownerAwakenerId ?? '')
  if (ownerOrder !== 0) {
    return ownerOrder
  }

  const slotOrder =
    (skillSlotOrder.get(left.slot ?? '') ?? 99) - (skillSlotOrder.get(right.slot ?? '') ?? 99)
  if (slotOrder !== 0) {
    return slotOrder
  }

  return left.id.localeCompare(right.id)
}

export function getAwakenerSkills(): AwakenerSkillRecord[] {
  if (awakenerSkillsCache) {
    return awakenerSkillsCache
  }

  awakenerSkillsCache = awakenerSkillsDatasetSchema.parse(
    getPublicSkillCatalogRecords()
      .map(parsePublicV3SkillCatalogRecord)
      .sort(comparePublicSkillRecords)
      .map(adaptPublicV3SkillRecord),
  )
  return awakenerSkillsCache
}

export function getAwakenerSkillById(
  skillId: string,
  skills: AwakenerSkillRecord[],
): AwakenerSkillRecord | undefined {
  return skills.find((entry) => entry.id === skillId)
}

export function getAwakenerSkillsForAwakener(
  awakenerId: number,
  skills: AwakenerSkillRecord[],
): AwakenerSkillRecord[] {
  return skills.filter((entry) => entry.ownerAwakenerId === awakenerId)
}
