import {z} from 'zod'

import possesLite from '@/data/posses-lite.json'

const rawPossesSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    index: z.number().int().nonnegative(),
    name: z.string().trim().min(1),
    realm: z.string().trim().min(1),
    isFadedLegacy: z.boolean(),
    awakenerName: z.string().trim().min(1).optional(),
  }),
)

export interface Posse {
  id: string
  index: number
  name: string
  realm: string
  isFadedLegacy: boolean
  awakenerName?: string
}

const parsedPosses = rawPossesSchema.parse(possesLite)

export function getPosses(): Posse[] {
  return parsedPosses
}
