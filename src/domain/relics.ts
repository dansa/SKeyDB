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
    id: z.string().regex(/^relic-\d{4}$/),
    relicType: nonEmptyStringSchema.optional(),
    name: nonEmptyStringSchema,
    ownerAwakenerId: z
      .string()
      .regex(/^awakener-\d{4}$/)
      .optional(),
    ownerAwakenerName: nonEmptyStringSchema.optional(),
    descriptionTemplate: z.string().default(''),
    descriptionArgs: publicDescriptionArgsSchema.default({}),
  })
  .loose()

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

const parsedRelics: Relic[] = getPublicCatalogRecords('relics')
  .map((record) => publicRelicRecordSchema.parse(record))
  .map(
    (relic): Relic => ({
      id: relic.id,
      kind: relic.relicType === 'DIMENSIONAL_IMAGE' ? 'PORTRAIT' : 'GENERIC',
      ownerAwakenerId: relic.ownerAwakenerId,
      ownerAwakenerName: relic.ownerAwakenerName,
      assetId: getRelicPublicAssetId(relic.id),
      name: relic.name,
      description: renderRelicDescription(relic.descriptionTemplate, relic.descriptionArgs),
    }),
  )

const portraitRelics: PortraitRelic[] = parsedRelics.filter(
  (relic): relic is PortraitRelic => relic.kind === 'PORTRAIT' && !!relic.ownerAwakenerId,
)

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

assertPortraitRelicsLinkedToKnownAwakeners(portraitRelics)
const portraitRelicByAwakenerId = buildPortraitRelicByAwakenerIdMap(portraitRelics)
const relicDescriptionByIdPromises = new Map<string, Promise<string>>()

function getRelicPublicAssetId(relicId: string): string {
  const assetIndexId = resolvePublicEntityAsset(relicId, 'icon')
  return assetIndexId ? (resolvePublicAsset(assetIndexId)?.assetId ?? '') : ''
}

export function getRelics(): Relic[] {
  return parsedRelics
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

export async function loadRelicDescriptionById(relicId: string): Promise<string> {
  const cachedPromise = relicDescriptionByIdPromises.get(relicId)
  if (cachedPromise) {
    return cachedPromise
  }

  const descriptionPromise = loadPublicRecord('relics', relicId).then((record) => {
    if (!record) {
      return ''
    }
    const relic = publicRelicRecordSchema.parse(record)
    return renderRelicDescription(relic.descriptionTemplate, relic.descriptionArgs)
  })
  relicDescriptionByIdPromises.set(relicId, descriptionPromise)
  return descriptionPromise
}
