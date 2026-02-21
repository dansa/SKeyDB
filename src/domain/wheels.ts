import { z } from 'zod'
import wheelsLite from '../data/wheels-lite.json'

const rawWheelsSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    assetId: z.string().trim().min(1),
  }),
)

export type Wheel = {
  id: string
  assetId: string
}

const parsedWheels = rawWheelsSchema.parse(wheelsLite)

export function getWheels(): Wheel[] {
  return parsedWheels
}

