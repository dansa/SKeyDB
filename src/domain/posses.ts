import {z} from 'zod'

import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicV3PosseCatalogRecordSchema = z
  .object({
    id: z.string().regex(/^posse-\d{4}$/),
    name: nonEmptyStringSchema,
    realm: nonEmptyStringSchema,
    ownerAwakenerId: z
      .string()
      .regex(/^awakener-\d{4}$/)
      .optional(),
    ownerAwakenerName: nonEmptyStringSchema.optional(),
    lineupToken: nonEmptyStringSchema,
  })
  .loose()

export interface Posse {
  id: string
  index: number
  name: string
  realm: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  isFadedLegacy: boolean
  lineupToken: string
}

function getPosseIndex(publicId: string): number {
  const suffix = /^posse-(\d{4})$/.exec(publicId)?.[1]
  if (!suffix) {
    throw new Error(`Cannot derive index from public posse id "${publicId}".`)
  }
  return Number(suffix)
}

const parsedPosses = getPublicCatalogRecords('posses').map((record): Posse => {
  const posse = publicV3PosseCatalogRecordSchema.parse(record)
  return {
    id: posse.id,
    index: getPosseIndex(posse.id),
    name: posse.name,
    realm: posse.realm,
    ownerAwakenerId: posse.ownerAwakenerId,
    ownerAwakenerName: posse.ownerAwakenerName,
    isFadedLegacy: posse.realm === 'FADED_LEGACY',
    lineupToken: posse.lineupToken,
  }
})

export function getPosses(): Posse[] {
  return parsedPosses
}
