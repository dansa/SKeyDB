import { z } from 'zod'
import possesLite from '../data/posses-lite.json'

const rawPossesSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    assetSlug: z.string().trim().min(1),
    faction: z.string().trim().min(1),
    isFadedLegacy: z.boolean(),
    awakenerName: z.string().trim().min(1).optional(),
  }),
)

export type Posse = {
  id: string
  name: string
  assetSlug: string
  faction: string
  isFadedLegacy: boolean
  awakenerName?: string
}

const parsedPosses = rawPossesSchema.parse(possesLite)

export function getPosses(): Posse[] {
  return parsedPosses
}
