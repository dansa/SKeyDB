import { z } from 'zod'
import covenantsLite from '../data/covenants-lite.json'

const rawCovenantsSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    assetId: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
)

export type Covenant = {
  id: string
  assetId: string
  name: string
}

const parsedCovenants = rawCovenantsSchema.parse(covenantsLite)

export function getCovenants(): Covenant[] {
  return parsedCovenants
}
