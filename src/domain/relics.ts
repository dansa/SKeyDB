import {z} from 'zod'

import {
  resolvePublicAsset,
  resolvePublicEntityAsset,
} from '@/data-access/public-data/assetRepository'
import {getPublicCatalogRecords} from '@/data-access/public-data/catalogRepository'
import {loadPublicRecord} from '@/data-access/public-data/recordRepository'

import {getAwakeners} from './awakeners'
import {resolveDescriptionTemplate} from './description-args'
import {publicDescriptionArgsSchema} from './public-description-args.schema'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicRelicRecordSchema = z
  .object({
    kind: z.literal('relic').optional(),
    id: z.string().regex(/^relic-\d{4}$/),
    relicType: nonEmptyStringSchema.optional(),
    rarity: nonEmptyStringSchema.optional(),
    name: nonEmptyStringSchema,
    route: z
      .object({
        slug: nonEmptyStringSchema,
        canonicalPath: nonEmptyStringSchema,
      })
      .optional(),
    assets: z.record(nonEmptyStringSchema, nonEmptyStringSchema).default({}),
    ownerAwakenerId: z
      .string()
      .regex(/^awakener-\d{4}$/)
      .optional(),
    ownerAwakenerName: nonEmptyStringSchema.optional(),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
    lore: z.string().optional(),
  })
  .loose()

export type PublicRelicRecord = z.infer<typeof publicRelicRecordSchema>

function renderRelicDescription(
  descriptionTemplate: string,
  descriptionArgs: z.infer<typeof publicDescriptionArgsSchema>,
): string {
  return resolveDescriptionTemplate(descriptionTemplate, descriptionArgs).replace(
    /\[(?:(?:[A-Za-z]+|\{[^}\]]+\}):)?(?:StateArg|DescArg|Arg)\d+\]/g,
    '?',
  )
}

export interface Relic {
  id: string
  kind: 'PORTRAIT' | 'GENERIC'
  ownerAwakenerId?: string
  ownerAwakenerName?: string
  assetId: string
  name: string
  description: string
}

export type RelicKind = Relic['kind']
export type PortraitRelic = Relic & {
  kind: 'PORTRAIT'
  ownerAwakenerId: string
}

const parsedRelics: Relic[] = getPublicCatalogRecords('relics').map((record): Relic => {
  const relic = publicRelicRecordSchema.parse(record)
  return {
    id: relic.id,
    kind: relic.relicType === 'DIMENSIONAL_IMAGE' ? 'PORTRAIT' : 'GENERIC',
    ownerAwakenerId: relic.ownerAwakenerId,
    ownerAwakenerName: relic.ownerAwakenerName,
    assetId: getRelicPublicAssetId(relic.id),
    name: relic.name,
    description: renderRelicDescription(relic.descriptionTemplate, relic.descriptionArgs),
  }
})

function assertPortraitRelicsHaveOwnerAwakenerIds(relics: Relic[]) {
  for (const relic of relics) {
    if (relic.kind === 'PORTRAIT' && !relic.ownerAwakenerId) {
      throw new Error(`Portrait relic "${relic.id}" is missing ownerAwakenerId.`)
    }
  }
}

function isPortraitRelic(relic: Relic): relic is PortraitRelic {
  return relic.kind === 'PORTRAIT' && Boolean(relic.ownerAwakenerId)
}

function buildPortraitRelicByAwakenerIdMap(relics: PortraitRelic[]): Map<string, PortraitRelic> {
  const byAwakenerId = new Map<string, PortraitRelic>()
  for (const relic of relics) {
    const existing = byAwakenerId.get(relic.ownerAwakenerId)
    if (existing) {
      throw new Error(
        `Duplicate portrait relic ownerAwakenerId "${relic.ownerAwakenerId}" for relic ids "${existing.id}" and "${relic.id}".`,
      )
    }
    byAwakenerId.set(relic.ownerAwakenerId, relic)
  }
  return byAwakenerId
}

function buildRelicByIdMap(relics: Relic[]): Map<string, Relic> {
  const byId = new Map<string, Relic>()
  for (const relic of relics) {
    const existing = byId.get(relic.id)
    if (existing) {
      throw new Error(`Duplicate relic id "${relic.id}".`)
    }
    byId.set(relic.id, relic)
  }
  return byId
}

function assertPortraitRelicsLinkedToKnownAwakeners(relics: PortraitRelic[]) {
  const knownAwakenerIds = new Set(getAwakeners().map((awakener) => awakener.id))

  for (const relic of relics) {
    if (!knownAwakenerIds.has(relic.ownerAwakenerId)) {
      throw new Error(
        `Portrait relic "${relic.id}" references unknown ownerAwakenerId "${relic.ownerAwakenerId}".`,
      )
    }
  }
}

assertPortraitRelicsHaveOwnerAwakenerIds(parsedRelics)
const portraitRelics: PortraitRelic[] = parsedRelics.filter(isPortraitRelic)
assertPortraitRelicsLinkedToKnownAwakeners(portraitRelics)
const relicById = buildRelicByIdMap(parsedRelics)
const portraitRelicByAwakenerId = buildPortraitRelicByAwakenerIdMap(portraitRelics)
const relicDescriptionByIdPromises = new Map<string, Promise<string>>()

function getRelicPublicAssetId(relicId: string): string {
  const assetIndexId = resolvePublicEntityAsset(relicId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''
}

export function getRelics(): Relic[] {
  return parsedRelics
}

export function getRelicById(relicId: string): Relic | undefined {
  return relicById.get(relicId)
}

export function getPortraitRelics(): PortraitRelic[] {
  return portraitRelics
}

export function getPortraitRelicByAwakenerId(
  awakenerId: string | undefined,
): PortraitRelic | undefined {
  if (!awakenerId) {
    return undefined
  }
  return portraitRelicByAwakenerId.get(awakenerId)
}

export async function loadRelicRecordById(relicId: string): Promise<PublicRelicRecord | undefined> {
  const record = await loadPublicRecord('relics', relicId)
  return record ? publicRelicRecordSchema.parse(record) : undefined
}

export async function loadRelicDescriptionById(relicId: string): Promise<string> {
  const cachedPromise = relicDescriptionByIdPromises.get(relicId)
  if (cachedPromise) {
    return cachedPromise
  }

  const descriptionPromise = loadRelicRecordById(relicId).then((relic) => {
    if (!relic) {
      return ''
    }
    return renderRelicDescription(relic.descriptionTemplate, relic.descriptionArgs)
  })
  relicDescriptionByIdPromises.set(relicId, descriptionPromise)
  return descriptionPromise
}
