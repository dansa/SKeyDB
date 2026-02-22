import { z } from 'zod'
import wheelsLite from '../data/wheels-lite.json'

const rawWheelsSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    assetId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    rarity: z.enum(['SSR', 'SR', 'R']),
    faction: z.enum(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL']),
    awakener: z.string(),
    mainstat: z.string(),
  }),
)

export type WheelRarity = 'SSR' | 'SR' | 'R'
export type WheelFaction = 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL'

export type Wheel = {
  id: string
  assetId: string
  name: string
  rarity: WheelRarity
  faction: WheelFaction
  awakener: string
  mainstat: string
}

const parsedWheels = rawWheelsSchema.parse(wheelsLite)
const wheelById = new Map(parsedWheels.map((wheel) => [wheel.id, wheel]))

export function getWheels(): Wheel[] {
  return parsedWheels
}

export function getWheelById(wheelId: string): Wheel | undefined {
  return wheelById.get(wheelId)
}

