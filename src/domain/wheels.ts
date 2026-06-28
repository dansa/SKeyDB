import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicWheelCatalogRecords} from '@/data-access/public-data/catalogScopes/wheelsCatalog'

import {getMainstatByKey, WHEEL_MAINSTAT_KEYS, type WheelMainstatKey} from './mainstats'

export type WheelRarity = 'SSR' | 'SR' | 'R' | 'N'
export type WheelRealm = 'AEQUOR' | 'CARO' | 'CHAOS' | 'ULTRA' | 'NEUTRAL'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicV3WheelCatalogRecordSchema = z
  .object({
    id: z.string().regex(/^wheel-\d{4}$/),
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
  })
  .loose()

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

function getWheelPublicAssetId(wheelId: string): string {
  const assetIndexId = resolvePublicEntityAsset(wheelId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? 'TBD') : 'TBD'
}

const parsedWheels: Wheel[] = getPublicWheelCatalogRecords().map((record) => {
  const wheel = publicV3WheelCatalogRecordSchema.parse(record)
  return {
    id: wheel.id,
    assetId: getWheelPublicAssetId(wheel.id),
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
  }
})
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
