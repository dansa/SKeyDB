import {z} from 'zod'

import {getPublicAwakenerBuildCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenerBuildsCatalog'
import {getPublicAwakenerCatalogRecords} from '@/data-access/public-data/catalogScopes/awakenersCatalog'
import {getPublicBuilderCatalog} from '@/data-access/public-data/collectionRepository'

import type {Covenant} from './covenants'
import {
  MAINSTAT_KEYS,
  WHEEL_MAINSTAT_KEYS,
  type MainstatKey,
  type WheelMainstatKey,
} from './mainstats'
import type {Wheel} from './wheels'

export const AWAKENER_BUILD_WHEEL_TIERS = ['BIS_SSR', 'ALT_SSR', 'BIS_SR', 'GOOD'] as const

export type AwakenerBuildWheelTier = (typeof AWAKENER_BUILD_WHEEL_TIERS)[number]

interface WheelRecommendationComparisonOptions {
  build: AwakenerBuild | null | undefined
  fallbackCompare: (left: Wheel, right: Wheel) => number
  promoteMainstats: boolean
}

interface CovenantRecommendationComparisonOptions {
  fallbackCompare: (left: Covenant, right: Covenant) => number
}

const wheelRecommendationGroupSchema = z.object({
  tier: z.enum(AWAKENER_BUILD_WHEEL_TIERS),
  wheelIds: z.array(z.string().trim().min(1)).min(1),
})

const awakenerBuildSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  summary: z.string().trim().min(1).optional(),
  note: z.string().trim().min(1).optional(),
  substatPriorityGroups: z.array(z.array(z.enum(MAINSTAT_KEYS)).min(1)).min(1),
  recommendedWheelMainstats: z.array(z.enum(WHEEL_MAINSTAT_KEYS)).min(1).optional(),
  recommendedWheels: z.array(wheelRecommendationGroupSchema).min(1),
  recommendedCovenantIds: z.array(z.string().trim().min(1)).min(1),
})

const awakenerBuildEntrySchema = z.object({
  id: z.string().regex(/^awakener-build-\d{4}$/),
  awakenerId: z.string().regex(/^awakener-\d{4}$/),
  awakenerName: z.string().trim().min(1).optional(),
  primaryBuildId: z.string().trim().min(1).optional(),
  recommendedPosseIds: z.array(z.string().trim().min(1)).min(1).optional(),
  builds: z.array(awakenerBuildSchema).min(1),
})

function getBuilderOptionIdSet(optionKey: string): Set<string> {
  return new Set(getPublicBuilderCatalog().options[optionKey] ?? [])
}

const awakenerBuildEntriesSchema = z.array(awakenerBuildEntrySchema).superRefine((entries, ctx) => {
  const awakenerById = new Map(
    getPublicAwakenerCatalogRecords().map((awakener) => [awakener.id, awakener]),
  )
  const awakenerIdSet = getBuilderOptionIdSet('awakeners')
  const awakenerBuildIdSet = getBuilderOptionIdSet('awakenerBuilds')
  const wheelIdSet = getBuilderOptionIdSet('wheels')
  const covenantIdSet = getBuilderOptionIdSet('covenants')
  const posseIdSet = getBuilderOptionIdSet('posses')
  const seenAwakenerIds = new Set<string>()

  entries.forEach((entry, entryIndex) => {
    if (!awakenerBuildIdSet.has(entry.id)) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown awakener build id ${entry.id}.`,
        path: [entryIndex, 'id'],
      })
    }

    if (seenAwakenerIds.has(entry.awakenerId)) {
      ctx.addIssue({
        code: 'custom',
        message: `Duplicate awakenerId ${entry.awakenerId}.`,
        path: [entryIndex, 'awakenerId'],
      })
    }
    seenAwakenerIds.add(entry.awakenerId)

    if (!awakenerIdSet.has(entry.awakenerId)) {
      ctx.addIssue({
        code: 'custom',
        message: `Unknown awakenerId ${entry.awakenerId}.`,
        path: [entryIndex, 'awakenerId'],
      })
    }

    const expectedAwakenerName = awakenerById.get(entry.awakenerId)?.name
    if (entry.awakenerName && expectedAwakenerName && entry.awakenerName !== expectedAwakenerName) {
      ctx.addIssue({
        code: 'custom',
        message: `awakenerName "${entry.awakenerName}" does not match canonical awakener name "${expectedAwakenerName}" for id ${entry.awakenerId}.`,
        path: [entryIndex, 'awakenerName'],
      })
    }

    const seenBuildIds = new Set<string>()
    entry.builds.forEach((build, buildIndex) => {
      if (seenBuildIds.has(build.id)) {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate build id "${build.id}".`,
          path: [entryIndex, 'builds', buildIndex, 'id'],
        })
      }
      seenBuildIds.add(build.id)

      const seenSubstats = new Set<MainstatKey>()
      build.substatPriorityGroups.forEach((group, groupIndex) => {
        group.forEach((key, keyIndex) => {
          if (seenSubstats.has(key)) {
            ctx.addIssue({
              code: 'custom',
              message: `Duplicate substat priority "${key}".`,
              path: [
                entryIndex,
                'builds',
                buildIndex,
                'substatPriorityGroups',
                groupIndex,
                keyIndex,
              ],
            })
          }
          seenSubstats.add(key)
        })
      })

      const seenTiers = new Set<AwakenerBuildWheelTier>()
      const seenWheelIds = new Set<string>()
      build.recommendedWheels.forEach((group, groupIndex) => {
        if (seenTiers.has(group.tier)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate wheel tier "${group.tier}".`,
            path: [entryIndex, 'builds', buildIndex, 'recommendedWheels', groupIndex, 'tier'],
          })
        }
        seenTiers.add(group.tier)

        group.wheelIds.forEach((wheelId, wheelIndex) => {
          if (seenWheelIds.has(wheelId)) {
            ctx.addIssue({
              code: 'custom',
              message: `Duplicate wheel reference "${wheelId}".`,
              path: [
                entryIndex,
                'builds',
                buildIndex,
                'recommendedWheels',
                groupIndex,
                'wheelIds',
                wheelIndex,
              ],
            })
          }
          seenWheelIds.add(wheelId)
          if (!wheelIdSet.has(wheelId)) {
            ctx.addIssue({
              code: 'custom',
              message: `Unknown wheel id "${wheelId}".`,
              path: [
                entryIndex,
                'builds',
                buildIndex,
                'recommendedWheels',
                groupIndex,
                'wheelIds',
                wheelIndex,
              ],
            })
          }
        })
      })

      const seenCovenantIds = new Set<string>()
      build.recommendedCovenantIds.forEach((covenantId, covenantIndex) => {
        if (seenCovenantIds.has(covenantId)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate covenant reference "${covenantId}".`,
            path: [entryIndex, 'builds', buildIndex, 'recommendedCovenantIds', covenantIndex],
          })
        }
        seenCovenantIds.add(covenantId)
        if (!covenantIdSet.has(covenantId)) {
          ctx.addIssue({
            code: 'custom',
            message: `Unknown covenant id "${covenantId}".`,
            path: [entryIndex, 'builds', buildIndex, 'recommendedCovenantIds', covenantIndex],
          })
        }
      })
    })

    if (entry.primaryBuildId && !entry.builds.some((build) => build.id === entry.primaryBuildId)) {
      ctx.addIssue({
        code: 'custom',
        message: `primaryBuildId "${entry.primaryBuildId}" does not exist in builds.`,
        path: [entryIndex, 'primaryBuildId'],
      })
    }

    if (entry.recommendedPosseIds) {
      const seenPosseIds = new Set<string>()
      entry.recommendedPosseIds.forEach((posseId, posseIndex) => {
        if (seenPosseIds.has(posseId)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate posse reference "${posseId}".`,
            path: [entryIndex, 'recommendedPosseIds', posseIndex],
          })
        }
        seenPosseIds.add(posseId)
        if (!posseIdSet.has(posseId)) {
          ctx.addIssue({
            code: 'custom',
            message: `Unknown posse id "${posseId}".`,
            path: [entryIndex, 'recommendedPosseIds', posseIndex],
          })
        }
      })
    }
  })
})

export type AwakenerBuild = z.infer<typeof awakenerBuildSchema>
export type AwakenerBuildEntry = z.infer<typeof awakenerBuildEntrySchema>

let awakenerBuildEntriesCache: AwakenerBuildEntry[] | null = null
const wheelRecommendationTierByBuildCache = new WeakMap<
  AwakenerBuild,
  ReadonlyMap<string, AwakenerBuildWheelTier>
>()

function getWheelTierOrder(tier: AwakenerBuildWheelTier): number {
  return AWAKENER_BUILD_WHEEL_TIERS.indexOf(tier)
}

function getWheelRecommendationTierById(
  build: AwakenerBuild,
): ReadonlyMap<string, AwakenerBuildWheelTier> {
  const cached = wheelRecommendationTierByBuildCache.get(build)
  if (cached) {
    return cached
  }

  const tierById = new Map<string, AwakenerBuildWheelTier>()
  for (const group of build.recommendedWheels) {
    for (const wheelId of group.wheelIds) {
      if (!tierById.has(wheelId)) {
        tierById.set(wheelId, group.tier)
      }
    }
  }
  wheelRecommendationTierByBuildCache.set(build, tierById)
  return tierById
}

export function getAwakenerBuildEntries(): AwakenerBuildEntry[] {
  if (awakenerBuildEntriesCache) {
    return awakenerBuildEntriesCache
  }
  awakenerBuildEntriesCache = awakenerBuildEntriesSchema.parse(
    getPublicAwakenerBuildCatalogRecords(),
  )
  return awakenerBuildEntriesCache
}

export function loadAwakenerBuildEntries(): Promise<AwakenerBuildEntry[]> {
  return Promise.resolve(getAwakenerBuildEntries())
}

export function buildAwakenerBuildEntryMap(
  entries: AwakenerBuildEntry[],
): Map<string, AwakenerBuildEntry> {
  return new Map(entries.map((entry) => [entry.awakenerId, entry]))
}

export function getAwakenerBuildEntryById(
  awakenerId: string,
  entries: AwakenerBuildEntry[],
): AwakenerBuildEntry | undefined {
  return entries.find((entry) => entry.awakenerId === awakenerId)
}

export function getPrimaryAwakenerBuild(
  entry: AwakenerBuildEntry | null | undefined,
): AwakenerBuild | undefined {
  if (!entry) {
    return undefined
  }
  if (entry.primaryBuildId) {
    const primaryBuild = entry.builds.find((build) => build.id === entry.primaryBuildId)
    if (primaryBuild) {
      return primaryBuild
    }
  }
  return entry.builds[0]
}

export function getWheelRecommendationTier(
  build: AwakenerBuild | null | undefined,
  wheelId: string,
): AwakenerBuildWheelTier | null {
  if (!build) {
    return null
  }
  return getWheelRecommendationTierById(build).get(wheelId) ?? null
}

export function isWheelMainstatRecommended(
  build: AwakenerBuild | null | undefined,
  mainstatKey: WheelMainstatKey,
): boolean {
  return build?.recommendedWheelMainstats?.includes(mainstatKey) ?? false
}

export function getWheelMainstatRecommendationIndex(
  build: AwakenerBuild | null | undefined,
  mainstatKey: WheelMainstatKey,
): number {
  if (!build?.recommendedWheelMainstats) {
    return -1
  }
  return build.recommendedWheelMainstats.indexOf(mainstatKey)
}

export function getCovenantRecommendationIndex(
  build: AwakenerBuild | null | undefined,
  covenantId: string,
): number {
  if (!build) {
    return -1
  }
  return build.recommendedCovenantIds.indexOf(covenantId)
}

export function getPosseRecommendationIndex(
  entry: AwakenerBuildEntry | null | undefined,
  posseId: string,
): number {
  if (!entry?.recommendedPosseIds) {
    return -1
  }
  return entry.recommendedPosseIds.indexOf(posseId)
}

function getWheelRecommendationBucket(
  wheel: Wheel,
  options: WheelRecommendationComparisonOptions,
): number {
  const tier = getWheelRecommendationTier(options.build, wheel.id)
  if (tier) {
    return getWheelTierOrder(tier)
  }
  const mainstatIndex =
    options.promoteMainstats && options.build
      ? getWheelMainstatRecommendationIndex(options.build, wheel.mainstatKey)
      : -1
  if (mainstatIndex >= 0) {
    return AWAKENER_BUILD_WHEEL_TIERS.length + mainstatIndex
  }
  return (
    AWAKENER_BUILD_WHEEL_TIERS.length + (options.build?.recommendedWheelMainstats?.length ?? 0) + 1
  )
}

export function compareWheelsForBuildRecommendation(
  left: Wheel,
  right: Wheel,
  options: WheelRecommendationComparisonOptions,
): number {
  const leftBucket = getWheelRecommendationBucket(left, options)
  const rightBucket = getWheelRecommendationBucket(right, options)
  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }
  return options.fallbackCompare(left, right)
}

export function compareCovenantsForBuildRecommendation(
  left: Covenant,
  right: Covenant,
  build: AwakenerBuild | null | undefined,
  options: CovenantRecommendationComparisonOptions,
): number {
  const leftIndex = getCovenantRecommendationIndex(build, left.id)
  const rightIndex = getCovenantRecommendationIndex(build, right.id)
  const leftRecommended = leftIndex >= 0
  const rightRecommended = rightIndex >= 0

  if (leftRecommended && rightRecommended && leftIndex !== rightIndex) {
    return leftIndex - rightIndex
  }
  if (leftRecommended !== rightRecommended) {
    return leftRecommended ? -1 : 1
  }
  return options.fallbackCompare(left, right)
}
