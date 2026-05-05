import {z} from 'zod'

import {ENLIGHTEN_SLOT_KEYS, type AwakenerTalentRecord} from './awakener-source-schema'
import type {AwakenerFullRecord} from './awakeners-full'

export const selectedEnlightenSlotSchema = z.enum(ENLIGHTEN_SLOT_KEYS).nullable()

export function isSoulforgeTalent(record: Pick<AwakenerTalentRecord, 'id'>): boolean {
  return record.id.endsWith('.soulforge-aptitude')
}

export function getSoulforgeTalents(
  talents: AwakenerFullRecord['talents'],
): AwakenerTalentRecord[] {
  return [talents.T1, talents.T2, talents.T3, talents.T4, ...talents.extraTalents]
    .filter((entry): entry is AwakenerTalentRecord => Boolean(entry))
    .filter(isSoulforgeTalent)
}
