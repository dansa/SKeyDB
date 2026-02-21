import { z } from 'zod'
import possesLite from '../data/posses-lite.json'

const rawPossesSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    index: z.number().int().nonnegative(),
    name: z.string().trim().min(1),
    faction: z.string().trim().min(1),
    isFadedLegacy: z.boolean(),
    awakenerName: z.string().trim().min(1).optional(),
  }),
)

export type Posse = {
  id: string
  index: number
  name: string
  faction: string
  isFadedLegacy: boolean
  awakenerName?: string
}

const parsedPosses = rawPossesSchema.parse(possesLite)

export function getPosses(): Posse[] {
  return parsedPosses
}
