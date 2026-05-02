import {z} from 'zod'

import publicRelicsFull from '@/data/public-v2/full/relics.json'

import {descriptionArgsSchema} from './awakener-source-schema'
import {getAwakeners} from './awakeners'
import {resolveDescriptionTemplate} from './description-args'

const nonEmptyStringSchema = z.string().trim().min(1)

const publicRelicsFullSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    scope: z.literal('relics'),
    recordCount: z.number().int().nonnegative(),
    records: z.array(
      z.object({
        id: z.string().regex(/^relic-\d{4}$/),
        kind: z.enum(['PORTRAIT', 'GENERIC']),
        name: nonEmptyStringSchema,
        assetId: nonEmptyStringSchema,
        ownerAwakenerId: z
          .string()
          .regex(/^awakener-\d{4}$/)
          .optional(),
        ownerAwakenerName: nonEmptyStringSchema.optional(),
        descriptionTemplate: z.string(),
        descriptionArgs: descriptionArgsSchema,
      }),
    ),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine((envelope) => envelope.recordCount === envelope.records.length, {
    message: 'recordCount must match records.length',
    path: ['recordCount'],
  })

function renderRelicDescription(
  descriptionTemplate: string,
  descriptionArgs: z.infer<typeof descriptionArgsSchema>,
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

const parsedRelics: Relic[] = publicRelicsFullSchema.parse(publicRelicsFull).records.map(
  (relic): Relic => ({
    id: relic.id,
    kind: relic.kind,
    ownerAwakenerId: relic.ownerAwakenerId,
    ownerAwakenerName: relic.ownerAwakenerName,
    assetId: relic.assetId,
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
