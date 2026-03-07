import {z} from 'zod'

import relicsLite from '@/data/relics-lite.json'

import {getAwakeners} from './awakeners'

const rawRelicsSchema = z.array(
  z.object({
    id: z.string().trim().min(1),
    kind: z.enum(['PORTRAIT', 'GENERIC']),
    awakenerIngameId: z.string().trim().min(1).optional(),
    assetId: z.string().trim().min(1),
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
  }),
)

export type Relic = z.infer<typeof rawRelicsSchema>[number]
export type RelicKind = Relic['kind']
export type PortraitRelic = Relic & {
  kind: 'PORTRAIT'
  awakenerIngameId: string
}

const parsedRelics: Relic[] = rawRelicsSchema.parse(relicsLite).map((relic) => ({
  ...relic,
  awakenerIngameId: relic.awakenerIngameId?.toUpperCase(),
}))

const portraitRelics: PortraitRelic[] = parsedRelics.filter(
  (relic): relic is PortraitRelic => relic.kind === 'PORTRAIT' && !!relic.awakenerIngameId,
)

function buildPortraitRelicByAwakenerIngameIdMap(
  relics: PortraitRelic[],
): Map<string, PortraitRelic> {
  const byAwakenerIngameId = new Map<string, PortraitRelic>()
  for (const relic of relics) {
    const existing = byAwakenerIngameId.get(relic.awakenerIngameId)
    if (existing) {
      throw new Error(
        `Duplicate portrait relic awakenerIngameId "${relic.awakenerIngameId}" for relic ids "${existing.id}" and "${relic.id}".`,
      )
    }
    byAwakenerIngameId.set(relic.awakenerIngameId, relic)
  }
  return byAwakenerIngameId
}

function assertPortraitRelicsLinkedToKnownAwakeners(relics: PortraitRelic[]) {
  const knownAwakenerIngameIds = new Set(
    getAwakeners()
      .map((awakener) => awakener.ingameId)
      .filter((ingameId): ingameId is string => Boolean(ingameId)),
  )

  for (const relic of relics) {
    if (!knownAwakenerIngameIds.has(relic.awakenerIngameId)) {
      throw new Error(
        `Portrait relic "${relic.id}" references unknown awakenerIngameId "${relic.awakenerIngameId}".`,
      )
    }
  }
}

assertPortraitRelicsLinkedToKnownAwakeners(portraitRelics)
const portraitRelicByAwakenerIngameId = buildPortraitRelicByAwakenerIngameIdMap(portraitRelics)

export function getRelics(): Relic[] {
  return parsedRelics
}

export function getPortraitRelics(): PortraitRelic[] {
  return portraitRelics
}

export function getPortraitRelicByAwakenerIngameId(
  awakenerIngameId: string | undefined,
): PortraitRelic | undefined {
  if (!awakenerIngameId) {
    return undefined
  }
  return portraitRelicByAwakenerIngameId.get(awakenerIngameId.trim().toUpperCase())
}
