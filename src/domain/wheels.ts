import {z} from 'zod'

import publicWheelsLite from '@/data/public-v2/lite/wheels.json'

import {getMainstatByKey, WHEEL_MAINSTAT_KEYS, type WheelMainstatKey} from './mainstats'

export type WheelRarity = 'SSR' | 'SR' | 'R' | 'N'
export type WheelRealm = 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicWheelsLiteSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('wheels'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^wheel-\d{4}$/),
        assetId: nonEmptyStringSchema,
        name: nonEmptyStringSchema,
        rarity: z.enum(['SSR', 'SR', 'R', 'N']),
        realm: z.enum(['AEQUOR', 'CARO', 'CHAOS', 'ULTRA', 'NEUTRAL', 'OTHER']),
        ownerAwakenerId: z
          .string()
          .regex(/^awakener-\d{4}$/)
          .optional(),
        ownerAwakenerName: nonEmptyStringSchema.optional(),
        mainstatKey: z.enum(WHEEL_MAINSTAT_KEYS),
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

export interface Wheel {
  id: string
  assetId: string
  name: string
  rarity: WheelRarity
  realm: WheelRealm
  awakener: string
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  aliases: string[]
  tags: string[]
  mainstatKey: WheelMainstatKey
  lineupToken: string
}

const parsedWheels: Wheel[] = publicWheelsLiteSchema
  .parse(publicWheelsLite)
  .records.map((wheel) => ({
    id: wheel.id,
    assetId: wheel.assetId,
    name: wheel.name,
    rarity: wheel.rarity,
    realm: wheel.realm === 'OTHER' ? 'NEUTRAL' : wheel.realm,
    awakener: wheel.ownerAwakenerName?.toLowerCase() ?? '',
    ownerAwakenerId: wheel.ownerAwakenerId,
    ownerAwakenerName: wheel.ownerAwakenerName,
    aliases: [wheel.name],
    tags: [],
    mainstatKey: wheel.mainstatKey,
    lineupToken: wheel.lineupToken,
  }))
const wheelById = new Map(parsedWheels.map((wheel) => [wheel.id, wheel]))

export function getWheels(): Wheel[] {
  return parsedWheels
}

export function getWheelById(wheelId: string): Wheel | undefined {
  return wheelById.get(wheelId)
}

export function getWheelMainstatLabel(wheel: Wheel): string {
  return getMainstatByKey(wheel.mainstatKey)?.label ?? ''
}
