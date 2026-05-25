import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {
  AWAKENER_BUILD_WHEEL_TIERS,
  compareCovenantsForBuildRecommendation,
  getCovenantRecommendationIndex,
  type AwakenerBuild,
  type AwakenerBuildWheelTier,
} from '@/domain/awakener-builds'
import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'
import {searchAwakenerResults} from '@/domain/awakeners-search'
import {
  compareAwakenersForCollectionSort,
  compareWheelsForCollectionSort,
  type AwakenerSortKey,
  type CollectionSortDirection,
  type WheelCollectionSortKey,
} from '@/domain/collection-sorting'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'
import {searchCovenants} from '@/domain/covenants-search'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import type {Posse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {compareSearchRelevance, getSearchRelevanceByEntityId} from '@/domain/search-relevance'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {matchesWheelMainstat, type WheelMainstatFilter} from '@/domain/wheel-mainstat-filters'
import {getWheelMainstatLabel, type Wheel} from '@/domain/wheels'
import {searchWheels} from '@/domain/wheels-search'

import {getTeamRealmSet} from '../builder/team-state'
import type {Team, TeamSlot, WheelUsageLocation} from '../builder/types'
import type {
  BuilderV2AwakenerFilter,
  BuilderV2AwakenerOption,
  BuilderV2CovenantOption,
  BuilderV2PosseFilter,
  BuilderV2PosseOption,
  BuilderV2WheelOption,
  BuilderV2WheelRarityFilter,
} from './BuilderV2ModelTypes'

export interface CreateBuilderV2AwakenerOptionsInput {
  allAwakeners: readonly Awakener[]
  searchQuery: string
  filter: BuilderV2AwakenerFilter
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  allowDuplicateAwakenerIdentities: boolean
  sortKey: AwakenerSortKey
  sortDirection: CollectionSortDirection
  sortGroupByRealm: boolean
  activeTeamSlots: readonly TeamSlot[]
  usedAwakenerIdentityKeys: ReadonlySet<string>
  usageAwakenerByIdentityKey: ReadonlyMap<string, {teamOrder: number}>
  ownedAwakenerLevelByName: ReadonlyMap<string, number | null>
  awakenerLevelByName: ReadonlyMap<string, number>
  isAwakenerOwnedByName: (awakenerName: string) => boolean
}

export interface CreateBuilderV2WheelOptionsInput {
  allWheels: readonly Wheel[]
  searchQuery: string
  rarityFilter: BuilderV2WheelRarityFilter
  mainstatFilter: WheelMainstatFilter
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  promoteRecommendedGear: boolean
  promoteMatchingWheelMainstats: boolean
  sortKey: WheelCollectionSortKey
  sortDirection: CollectionSortDirection
  recommendationById: ReadonlyMap<string, CachedWheelRecommendation>
  usedWheelIds: ReadonlySet<string>
  usedWheelByTeamOrder: ReadonlyMap<string, WheelUsageLocation>
  ownedWheelLevelById: ReadonlyMap<string, number | null>
  isWheelOwnedById: (wheelId: string) => boolean
}

export interface CreateBuilderV2CovenantOptionsInput {
  allCovenants: readonly Covenant[]
  searchQuery: string
  activeBuild: AwakenerBuild | null | undefined
  activeTeamSlots: readonly TeamSlot[]
  promoteRecommendedGear: boolean
}

export interface CreateBuilderV2PosseOptionsInput {
  allPosses: readonly Posse[]
  searchQuery: string
  filter: BuilderV2PosseFilter
  activeTeam: Team
  allowDuplicateAwakenerIdentities: boolean
  displayUnowned: boolean
  sinkUnownedToBottom: boolean
  promoteRecommendedGear: boolean
  recommendedPosseIds: ReadonlySet<string>
  usedPosseByTeamOrder: ReadonlyMap<string, number>
  isPosseOwnedById: (posseId: string) => boolean
}

export interface CachedWheelRecommendation {
  bucket: number
  tier: AwakenerBuildWheelTier | null
  mainstatIndex: number | undefined
}

export function createBuilderV2AwakenerOptions(
  input: CreateBuilderV2AwakenerOptionsInput,
): BuilderV2AwakenerOption[] {
  const searchResults = searchAwakenerResults([...input.allAwakeners], input.searchQuery)
  const searched = searchResults.map((result) => result.entity)
  const relevanceById = getSearchRelevanceByEntityId(searchResults, input.searchQuery)
  const byRealm =
    input.filter === 'ALL'
      ? searched
      : searched.filter((awakener) => awakener.realm.trim().toUpperCase() === input.filter)
  const byOwnership = input.displayUnowned
    ? byRealm
    : byRealm.filter((awakener) => input.isAwakenerOwnedByName(awakener.name))
  const sortableAwakenerById = new Map(
    byOwnership.map((awakener) => [
      awakener.id,
      createSortableAwakenerEntry(
        awakener,
        input.ownedAwakenerLevelByName,
        input.awakenerLevelByName,
      ),
    ]),
  )
  const sorted = [...byOwnership].sort((left, right) => {
    const relevanceCompare = compareSearchRelevance(left, right, relevanceById)
    if (relevanceCompare !== 0) {
      return relevanceCompare
    }
    const leftSortable = sortableAwakenerById.get(left.id)
    const rightSortable = sortableAwakenerById.get(right.id)
    if (!leftSortable || !rightSortable) {
      return 0
    }
    return compareAwakenersForCollectionSort(leftSortable, rightSortable, {
      key: input.sortKey,
      direction: input.sortDirection,
      groupByRealm: input.sortGroupByRealm,
    })
  })
  const visible = input.sinkUnownedToBottom
    ? sinkUnownedToEnd(sorted, (awakener) => input.isAwakenerOwnedByName(awakener.name))
    : sorted
  const teamRealmSet = getTeamRealmSet([...input.activeTeamSlots])

  return visible.map((awakener) => {
    const identityKey = getAwakenerIdentityKeyById(awakener.id)
    const inUse = input.usedAwakenerIdentityKeys.has(identityKey)
    const usedTeamOrder = input.usageAwakenerByIdentityKey.get(identityKey)?.teamOrder
    const blockedByDupes = !input.allowDuplicateAwakenerIdentities && inUse
    const blockedByRealm =
      teamRealmSet.size >= 2 && !teamRealmSet.has(awakener.realm.trim().toUpperCase())
    return {
      id: awakener.id,
      name: awakener.name,
      displayName: formatAwakenerNameForUi(awakener.name),
      realm: awakener.realm,
      portraitSrc: getAwakenerPortraitAsset(awakener.name),
      inUse,
      inUseLabel: usedTeamOrder === undefined ? null : `Team ${String(usedTeamOrder + 1)}`,
      owned: input.isAwakenerOwnedByName(awakener.name),
      level: input.awakenerLevelByName.get(awakener.name) ?? 60,
      enlightenLevel: input.ownedAwakenerLevelByName.get(awakener.name) ?? null,
      blocked: blockedByDupes || blockedByRealm,
      blockReason: blockedByDupes ? 'In use' : blockedByRealm ? 'Realm limit' : null,
    }
  })
}

export function createBuilderV2WheelOptions(
  input: CreateBuilderV2WheelOptionsInput,
): BuilderV2WheelOption[] {
  const byRarity =
    input.rarityFilter === 'ALL'
      ? input.allWheels
      : input.allWheels.filter((wheel) => wheel.rarity === input.rarityFilter)
  const byMainstat =
    input.mainstatFilter === 'ALL'
      ? byRarity
      : byRarity.filter((wheel) => matchesWheelMainstat(wheel.mainstatKey, input.mainstatFilter))
  const visible = input.displayUnowned
    ? byMainstat
    : byMainstat.filter((wheel) => input.isWheelOwnedById(wheel.id))
  const searched = searchWheels([...visible], input.searchQuery)
  const sortableWheelById = new Map(
    searched.map((wheel) => [wheel.id, createSortableWheelEntry(wheel, input.ownedWheelLevelById)]),
  )
  const wheelFallbackCompare = (left: Wheel, right: Wheel) =>
    compareSortableWheels(left, right, sortableWheelById, {
      key: input.sortKey,
      direction: input.sortDirection,
    })
  const sorted = [...searched].sort((left, right) =>
    input.promoteRecommendedGear
      ? compareWheelsForCachedBuildRecommendation(left, right, {
          fallbackCompare: wheelFallbackCompare,
          promoteMainstats: input.promoteMatchingWheelMainstats,
          recommendationById: input.recommendationById,
        })
      : wheelFallbackCompare(left, right),
  )
  const ordered = input.sinkUnownedToBottom
    ? sinkUnownedToEnd(sorted, (wheel) => input.isWheelOwnedById(wheel.id))
    : sorted

  return ordered.map((wheel) => {
    const usedByTeam = input.usedWheelByTeamOrder.get(wheel.id)
    const recommendationMeta = input.recommendationById.get(wheel.id)
    const recommendationTier = recommendationMeta?.tier ?? null
    const recommendedMainstatKey =
      input.promoteMatchingWheelMainstats && recommendationMeta?.mainstatIndex !== undefined
        ? wheel.mainstatKey
        : null
    return {
      id: wheel.id,
      name: wheel.name,
      rarity: wheel.rarity,
      realm: wheel.realm,
      mainstat: getWheelMainstatLabel(wheel),
      mainstatKey: wheel.mainstatKey,
      assetSrc: getWheelAssetById(wheel.id),
      inUse: input.usedWheelIds.has(wheel.id),
      inUseLabel: usedByTeam ? `Team ${String(usedByTeam.teamOrder + 1)}` : null,
      owned: input.isWheelOwnedById(wheel.id),
      enlightenLevel: input.ownedWheelLevelById.get(wheel.id) ?? null,
      recommended: Boolean(recommendationTier ?? recommendedMainstatKey),
      recommendationLabel: getWheelRecommendationChipLabel(recommendationTier),
      recommendedMainstatKey,
    }
  })
}

export function createBuilderV2CovenantOptions(
  input: CreateBuilderV2CovenantOptionsInput,
): BuilderV2CovenantOption[] {
  const searched = searchCovenants([...input.allCovenants], input.searchQuery)
  const sorted = [...searched].sort((left, right) =>
    input.promoteRecommendedGear
      ? compareCovenantsForBuildRecommendation(left, right, input.activeBuild, {
          fallbackCompare: compareCovenantsById,
        })
      : compareCovenantsById(left, right),
  )

  return sorted.map((covenant) => {
    const recommendationIndex = getCovenantRecommendationIndex(input.activeBuild, covenant.id)
    return {
      id: covenant.id,
      name: covenant.name,
      assetSrc: getCovenantAssetById(covenant.id),
      inUse: input.activeTeamSlots.some((slot) => slot.covenantId === covenant.id),
      recommended: recommendationIndex >= 0,
      recommendationLabel: recommendationIndex >= 0 ? `#${String(recommendationIndex + 1)}` : null,
    }
  })
}

export function createBuilderV2PosseOptions(
  input: CreateBuilderV2PosseOptionsInput,
): BuilderV2PosseOption[] {
  const searched = searchPosses([...input.allPosses], input.searchQuery)
  const byFilter = searched.filter((posse) => {
    if (input.filter === 'ALL') {
      return true
    }
    if (input.filter === 'FADED_LEGACY') {
      return posse.isFadedLegacy
    }
    return !posse.isFadedLegacy && posse.realm.trim().toUpperCase() === input.filter
  })
  const byOwnership = input.displayUnowned
    ? byFilter
    : byFilter.filter((posse) => input.isPosseOwnedById(posse.id))
  const sorted = input.promoteRecommendedGear
    ? [...byOwnership].sort((left, right) => {
        const leftRecommended = input.recommendedPosseIds.has(left.id)
        const rightRecommended = input.recommendedPosseIds.has(right.id)
        if (leftRecommended === rightRecommended) {
          return left.name.localeCompare(right.name)
        }
        return leftRecommended ? -1 : 1
      })
    : byOwnership
  const ordered = input.sinkUnownedToBottom
    ? sinkUnownedToEnd(sorted, (posse) => input.isPosseOwnedById(posse.id))
    : sorted

  return ordered.map((posse) => {
    const usedTeamOrder = input.usedPosseByTeamOrder.get(posse.id)
    const inUse = usedTeamOrder !== undefined
    const isActive = input.activeTeam.posseId === posse.id
    const blocked = !input.allowDuplicateAwakenerIdentities && inUse && !isActive
    return {
      id: posse.id,
      name: posse.name,
      realm: posse.realm,
      assetSrc: getPosseAssetById(posse.id),
      inUse,
      isActive,
      owned: input.isPosseOwnedById(posse.id),
      recommended: input.recommendedPosseIds.has(posse.id),
      blocked,
      statusLabel: isActive
        ? 'Active'
        : blocked
          ? `Team ${String(usedTeamOrder + 1)}`
          : !input.isPosseOwnedById(posse.id)
            ? 'Unowned'
            : input.recommendedPosseIds.has(posse.id)
              ? 'Rec'
              : null,
    }
  })
}

export function createWheelRecommendationMetaById(
  build: AwakenerBuild | null | undefined,
  wheels: readonly Wheel[],
): Map<string, CachedWheelRecommendation> {
  const metaById = new Map<string, CachedWheelRecommendation>()
  const defaultBucket =
    AWAKENER_BUILD_WHEEL_TIERS.length + (build?.recommendedWheelMainstats?.length ?? 0) + 1

  if (!build) {
    metaById.set('__default__', {
      bucket: defaultBucket,
      tier: null,
      mainstatIndex: undefined,
    })
    return metaById
  }

  build.recommendedWheels.forEach((group, groupIndex) => {
    for (const wheelId of group.wheelIds) {
      metaById.set(wheelId, {
        bucket: groupIndex,
        tier: group.tier,
        mainstatIndex: undefined,
      })
    }
  })

  build.recommendedWheelMainstats?.forEach((mainstatKey, mainstatIndex) => {
    for (const wheel of wheels) {
      if (wheel.mainstatKey !== mainstatKey || metaById.has(wheel.id)) {
        continue
      }
      metaById.set(wheel.id, {
        bucket: AWAKENER_BUILD_WHEEL_TIERS.length + mainstatIndex,
        tier: null,
        mainstatIndex,
      })
    }
  })

  metaById.set('__default__', {
    bucket: defaultBucket,
    tier: null,
    mainstatIndex: undefined,
  })

  return metaById
}

function createSortableAwakenerEntry(
  awakener: Awakener,
  ownedAwakenerLevelByName: ReadonlyMap<string, number | null>,
  awakenerLevelByName: ReadonlyMap<string, number>,
) {
  return {
    label: formatAwakenerNameForUi(awakener.name),
    index: awakener.numericId ?? Number.MAX_SAFE_INTEGER,
    owned: (ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null,
    enlighten: ownedAwakenerLevelByName.get(awakener.name) ?? 0,
    level: awakenerLevelByName.get(awakener.name) ?? 60,
    rarity: awakener.rarity,
    realm: awakener.realm,
    releaseDate: awakener.releaseDate,
  }
}

function createSortableWheelEntry(
  wheel: Wheel,
  ownedWheelLevelById: ReadonlyMap<string, number | null>,
) {
  return {
    label: wheel.name,
    index: Number.parseInt(wheel.id.replace(/\D+/g, ''), 10) || Number.MAX_SAFE_INTEGER,
    owned: (ownedWheelLevelById.get(wheel.id) ?? null) !== null,
    enlighten: ownedWheelLevelById.get(wheel.id) ?? 0,
    rarity: wheel.rarity,
    realm: wheel.realm,
    mainstatLabel: getWheelMainstatLabel(wheel),
  }
}

function compareSortableWheels(
  left: Wheel,
  right: Wheel,
  sortableWheelById: Map<string, ReturnType<typeof createSortableWheelEntry>>,
  sort: {key: WheelCollectionSortKey; direction: CollectionSortDirection},
): number {
  const leftSortable = sortableWheelById.get(left.id)
  const rightSortable = sortableWheelById.get(right.id)
  if (!leftSortable || !rightSortable) {
    return 0
  }
  return compareWheelsForCollectionSort(leftSortable, rightSortable, sort)
}

function compareWheelsForCachedBuildRecommendation(
  left: Wheel,
  right: Wheel,
  options: {
    fallbackCompare: (left: Wheel, right: Wheel) => number
    promoteMainstats: boolean
    recommendationById: ReadonlyMap<string, CachedWheelRecommendation>
  },
): number {
  const defaultBucket =
    options.recommendationById.get('__default__')?.bucket ?? AWAKENER_BUILD_WHEEL_TIERS.length + 1
  const leftMeta = options.recommendationById.get(left.id)
  const rightMeta = options.recommendationById.get(right.id)
  const leftBucket =
    leftMeta && (leftMeta.tier || options.promoteMainstats) ? leftMeta.bucket : defaultBucket
  const rightBucket =
    rightMeta && (rightMeta.tier || options.promoteMainstats) ? rightMeta.bucket : defaultBucket

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }

  return options.fallbackCompare(left, right)
}

function compareCovenantsById(left: Covenant, right: Covenant): number {
  return left.id.localeCompare(right.id, undefined, {numeric: true, sensitivity: 'base'})
}

function getWheelRecommendationChipLabel(tier: AwakenerBuildWheelTier | null): string | null {
  switch (tier) {
    case 'BIS_SSR':
      return 'BiS'
    case 'ALT_SSR':
      return 'Alt'
    case 'BIS_SR':
      return 'BiS SR'
    case 'GOOD':
      return 'Good'
    default:
      return null
  }
}

function sinkUnownedToEnd<TEntity>(
  entries: readonly TEntity[],
  isOwned: (entry: TEntity) => boolean,
): TEntity[] {
  return [...entries].sort((left, right) => {
    const leftOwned = isOwned(left)
    const rightOwned = isOwned(right)
    if (leftOwned === rightOwned) {
      return 0
    }
    return leftOwned ? -1 : 1
  })
}
