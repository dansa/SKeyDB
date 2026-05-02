import {z} from 'zod'

import publicPossesLite from '@/data/public-v2/lite/posses.json'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicPossesLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('posses'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^posse-\d{4}$/),
        name: nonEmptyStringSchema,
        realm: nonEmptyStringSchema,
        lineupToken: nonEmptyStringSchema,
      }),
    ),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

export interface Posse {
  id: string
  index: number
  name: string
  realm: string
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

const parsedPosses = publicPossesLiteSchema.parse(publicPossesLite).records.map(
  (posse): Posse => ({
    id: posse.id,
    index: getPosseIndex(posse.id),
    name: posse.name,
    realm: posse.realm,
    isFadedLegacy: posse.realm === 'FADED_LEGACY',
    lineupToken: posse.lineupToken,
  }),
)

export function getPosses(): Posse[] {
  return parsedPosses
}
