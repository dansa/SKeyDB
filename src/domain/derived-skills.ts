import {getPublicDerivedSkillCatalogRecords} from '@/data-access/public-data/catalogScopes/derivedSkillsCatalog'

import {derivedSkillsDatasetSchema, type DerivedSkillRecord} from './awakener-source-schema'
import {
  adaptPublicV3DerivedSkillRecord,
  parsePublicV3DerivedSkillCatalogRecord,
} from './public-v3-awakener-record-adapters'

let derivedSkillsCache: DerivedSkillRecord[] | null = null

export function getDerivedSkills(): DerivedSkillRecord[] {
  if (derivedSkillsCache) {
    return derivedSkillsCache
  }

  derivedSkillsCache = derivedSkillsDatasetSchema.parse(
    getPublicDerivedSkillCatalogRecords().map((record) =>
      adaptPublicV3DerivedSkillRecord(parsePublicV3DerivedSkillCatalogRecord(record)),
    ),
  )
  return derivedSkillsCache
}

export function loadDerivedSkills(): Promise<DerivedSkillRecord[]> {
  return Promise.resolve(getDerivedSkills())
}

export function getDerivedSkillById(
  derivedSkillId: string,
  derivedSkills: DerivedSkillRecord[],
): DerivedSkillRecord | undefined {
  return derivedSkills.find((entry) => entry.id === derivedSkillId)
}

export function getDerivedSkillsForAwakener(
  awakenerId: number,
  derivedSkills: DerivedSkillRecord[],
): DerivedSkillRecord[] {
  return derivedSkills.filter((entry) => entry.ownerAwakenerId === awakenerId)
}

export function getDerivedSkillsForRootSkill(
  rootSkillId: string,
  derivedSkills: DerivedSkillRecord[],
): DerivedSkillRecord[] {
  return derivedSkills.filter((entry) => entry.rootSkillId === rootSkillId)
}
