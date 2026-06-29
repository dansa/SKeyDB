import {getPublicTalentCatalogRecords} from '@/data-access/public-data/catalogScopes/talentsCatalog'

import {awakenerTalentsDatasetSchema, type AwakenerTalentRecord} from './awakener-source-schema'
import {
  adaptPublicV3TalentRecord,
  parsePublicV3TalentCatalogRecord,
} from './public-v3-awakener-record-adapters'

let awakenerTalentsCache: AwakenerTalentRecord[] | null = null

export function getAwakenerTalents(): AwakenerTalentRecord[] {
  if (awakenerTalentsCache) {
    return awakenerTalentsCache
  }

  awakenerTalentsCache = awakenerTalentsDatasetSchema.parse(
    getPublicTalentCatalogRecords().map((record) =>
      adaptPublicV3TalentRecord(parsePublicV3TalentCatalogRecord(record)),
    ),
  )
  return awakenerTalentsCache
}

export function getAwakenerTalentById(
  talentId: string,
  talents: AwakenerTalentRecord[],
): AwakenerTalentRecord | undefined {
  return talents.find((entry) => entry.id === talentId)
}

export function getAwakenerTalentsForAwakener(
  awakenerId: number,
  talents: AwakenerTalentRecord[],
): AwakenerTalentRecord[] {
  return talents.filter((entry) => entry.ownerAwakenerId === awakenerId)
}
