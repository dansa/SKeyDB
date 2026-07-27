import {z} from 'zod'

import {getPublicPosseCatalogRecords} from '@/data-access/public-data/catalogScopes/possesCatalog'

import {posseClassificationSchema, type PosseClassification} from './posse-classification'
import {
  publicDescriptionArgsSchema,
  type PublicDescriptionArg,
} from './public-description-args.schema'

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
    lineupToken: z.string().default(''),
    classification: posseClassificationSchema.default('STANDARD'),
    equippable: z.boolean().default(true),
    collectible: z.boolean().default(true),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
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
  classification?: PosseClassification
  equippable?: boolean
  collectible?: boolean
  descriptionTemplate?: string
  descriptionArgs?: Record<string, PublicDescriptionArg>
}

function getPosseIndex(publicId: string): number {
  const suffix = /^posse-(\d{4})$/.exec(publicId)?.[1]
  if (!suffix) {
    throw new Error(`Cannot derive index from public posse id "${publicId}".`)
  }
  return Number(suffix)
}

const parsedPosses = getPublicPosseCatalogRecords().map((record): Posse => {
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
    classification: posse.classification,
    equippable: posse.equippable,
    collectible: posse.collectible,
    descriptionTemplate: posse.descriptionTemplate,
    descriptionArgs: posse.descriptionArgs,
  }
})

export function getPosses(): Posse[] {
  return parsedPosses
}

export function getEquippablePosses(): Posse[] {
  return parsedPosses.filter((posse) => posse.equippable !== false)
}

export function getCollectiblePosses(): Posse[] {
  return parsedPosses.filter((posse) => posse.collectible !== false)
}

export function isPrimordialMemoryPosse(posse: Posse): boolean {
  return posse.classification === 'PRIMORDIAL_MEMORY'
}
