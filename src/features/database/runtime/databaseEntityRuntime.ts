import type {ComponentType} from 'react'

import {resolvePublicRoute} from '@/data-access/public-data/routeResolver'
import {
  parseAwakenerLoreRoute,
  buildAwakenerLoreSuffix,
  type AwakenerLoreRoute,
} from '@/domain/awakener-lore-routes'
import {
  DATABASE_ENTITY_DEFINITIONS,
  type DatabaseEntityId,
} from '@/domain/database-entity-definitions'
import {sanitizeDatabaseEntitySearch} from '@/domain/database-entity-search'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantPath,
  buildDatabasePossePath,
  buildDatabaseRelicPath,
  buildDatabaseOrisonPath,
  buildDatabaseWheelPath,
  DEFAULT_DATABASE_AWAKENER_TAB,
  findAwakenerByDatabaseSlug,
  findCovenantByDatabaseSlug,
  findPosseByDatabaseSlug,
  findRelicByDatabaseSlug,
  findOrisonByDatabaseSlug,
  findWheelByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  resolveDatabaseAwakenerVisibleTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import type {EntityBrowseProps} from '@/features/database/browse/EntityBrowseShared'
import type {
  DatabaseDetailNavigationState,
  DatabaseDetailRouteItem,
} from '@/features/database/detail/dbDetailRegistry'

import type {DatabaseDetailRouteRequest} from './databaseRouteResolution'

export interface ResolvedDatabaseDetailRoute {
  canonicalPath: string
  routeItem: DatabaseDetailRouteItem | null
}

export interface ResolvedDatabaseDetailReference {
  pathname: string
  resolution: ResolvedDatabaseDetailRoute
  search: string
}

interface ResolveDatabaseDetailReferenceOptions {
  defaultAwakenerTab: DatabaseAwakenerTab
  id: string
  search: string
  state: DatabaseDetailNavigationState
}

interface DatabaseEntityRuntimeDefinition {
  loadBrowse: () => Promise<{default: ComponentType<EntityBrowseProps>}>
  maxDetailSuffixSegments: number
  resolveDetailReference: (
    options: ResolveDatabaseDetailReferenceOptions,
  ) => Promise<ResolvedDatabaseDetailReference | null>
  resolveDetailRoute: (request: DatabaseDetailRouteRequest) => Promise<ResolvedDatabaseDetailRoute>
}

const DATABASE_ENTITY_RUNTIME_BY_ID = {
  awakeners: {
    maxDetailSuffixSegments: 3,
    resolveDetailReference: async ({defaultAwakenerTab, id, search, state}) => {
      const {getAwakeners} = await import('@/domain/awakeners')
      const item = getAwakeners().find((candidate) => candidate.id === id)
      if (!item) return null
      const activeTab = state.tab
        ? resolveDatabaseAwakenerVisibleTab(resolveDatabaseAwakenerTab(state.tab))
        : defaultAwakenerTab
      return createResolvedReferenceTarget(
        'awakeners',
        buildDatabaseAwakenerPath(item, activeTab, state.lore),
        {
          kind: 'awakener',
          item,
          activeTab,
          ...(activeTab === 'lore' ? {lore: state.lore ?? {section: 'intro'}} : {}),
        },
        search,
      )
    },
    resolveDetailRoute: async ({defaultAwakenerTab, slug, suffixSegments}) => {
      const {getAwakeners} = await import('@/domain/awakeners')
      const item = findAwakenerByDatabaseSlug(getAwakeners(), slug)
      const activeTab = suffixSegments[0]
        ? resolveDatabaseAwakenerVisibleTab(resolveDatabaseAwakenerTab(suffixSegments[0]))
        : defaultAwakenerTab
      const lore =
        activeTab === 'lore' ? parseAwakenerLoreRoute(suffixSegments.slice(1)) : undefined
      return {
        canonicalPath: item
          ? buildCanonicalAwakenerRoutePath(item, slug, activeTab, lore)
          : buildDatabaseAwakenerPath({name: slug}),
        routeItem: item ? {kind: 'awakener', item, activeTab, ...(lore ? {lore} : {})} : null,
      }
    },
    loadBrowse: () =>
      import('@/features/database/browse/AwakenersBrowse').then(({AwakenersBrowse}) => ({
        default: AwakenersBrowse,
      })),
  },
  wheels: {
    maxDetailSuffixSegments: 0,
    resolveDetailReference: async ({id, search}) => {
      const {getWheels} = await import('@/domain/wheels')
      const item = getWheels().find((candidate) => candidate.id === id)
      return item
        ? createResolvedReferenceTarget(
            'wheels',
            buildDatabaseWheelPath(item),
            {kind: 'wheel', item},
            search,
          )
        : null
    },
    resolveDetailRoute: async ({slug}) => {
      const {getWheels} = await import('@/domain/wheels')
      const item = findWheelByDatabaseSlug(getWheels(), slug)
      return {
        canonicalPath: item ? buildDatabaseWheelPath(item) : buildDatabaseWheelPath({name: slug}),
        routeItem: item ? {kind: 'wheel', item} : null,
      }
    },
    loadBrowse: () =>
      import('@/features/database/browse/WheelsBrowse').then(({WheelsBrowse}) => ({
        default: WheelsBrowse,
      })),
  },
  posses: {
    maxDetailSuffixSegments: 0,
    resolveDetailReference: async ({id, search}) => {
      const {getPosses} = await import('@/domain/posses')
      const item = getPosses().find((candidate) => candidate.id === id)
      return item
        ? createResolvedReferenceTarget(
            'posses',
            buildDatabasePossePath(item),
            {kind: 'posse', item},
            search,
          )
        : null
    },
    resolveDetailRoute: async ({slug}) => {
      const {getPosses} = await import('@/domain/posses')
      const item = findPosseByDatabaseSlug(getPosses(), slug)
      return {
        canonicalPath: item ? buildDatabasePossePath(item) : buildDatabasePossePath({name: slug}),
        routeItem: item ? {kind: 'posse', item} : null,
      }
    },
    loadBrowse: () =>
      import('@/features/database/browse/PossesBrowse').then(({PossesBrowse}) => ({
        default: PossesBrowse,
      })),
  },
  covenants: {
    maxDetailSuffixSegments: 0,
    resolveDetailReference: async ({id, search}) => {
      const {getCovenants} = await import('@/domain/covenants')
      const item = getCovenants().find((candidate) => candidate.id === id)
      return item
        ? createResolvedReferenceTarget(
            'covenants',
            buildDatabaseCovenantPath(item),
            {kind: 'covenant', item},
            search,
          )
        : null
    },
    resolveDetailRoute: async ({slug}) => {
      const {getCovenants} = await import('@/domain/covenants')
      const item = findCovenantByDatabaseSlug(getCovenants(), slug)
      return {
        canonicalPath: item
          ? buildDatabaseCovenantPath(item)
          : buildDatabaseCovenantPath({name: slug}),
        routeItem: item ? {kind: 'covenant', item} : null,
      }
    },
    loadBrowse: () =>
      import('@/features/database/browse/CovenantsBrowse').then(({CovenantsBrowse}) => ({
        default: CovenantsBrowse,
      })),
  },
  relics: {
    maxDetailSuffixSegments: 0,
    resolveDetailReference: async ({id, search, state}) => {
      const {getRelics} = await import('@/domain/relics')
      const item = getRelics().find((candidate) => candidate.id === id)
      if (!item) return null
      const nextSearchParams = new URLSearchParams(sanitizeRuntimeSearch('relics', search, true))
      if ('variant' in state) {
        if (state.variant) nextSearchParams.set('variant', state.variant)
        else nextSearchParams.delete('variant')
      }
      const nextSearch = nextSearchParams.size ? `?${nextSearchParams.toString()}` : ''
      return createResolvedReferenceTarget(
        'relics',
        buildDatabaseRelicPath(item),
        {kind: 'relic', item, variantId: nextSearchParams.get('variant') ?? undefined},
        nextSearch,
        true,
      )
    },
    resolveDetailRoute: async ({search, slug}) => {
      const {getRelics} = await import('@/domain/relics')
      const item = findRelicByDatabaseSlug(getRelics(), slug)
      const variantId = new URLSearchParams(search).get('variant') ?? undefined
      return {
        canonicalPath: item ? buildDatabaseRelicPath(item) : buildDatabaseRelicPath({name: slug}),
        routeItem: item ? {kind: 'relic', item, variantId} : null,
      }
    },
    loadBrowse: () =>
      import('@/features/database/browse/RelicsBrowse').then(({RelicsBrowse}) => ({
        default: RelicsBrowse,
      })),
  },
  orisons: {
    maxDetailSuffixSegments: 0,
    resolveDetailReference: async ({id, search, state}) => {
      const {getOrisons} = await import('@/domain/orisons')
      const item = getOrisons().find((candidate) => candidate.id === id)
      if (!item) return null
      const nextSearchParams = new URLSearchParams(sanitizeRuntimeSearch('orisons', search, true))
      if ('variant' in state) {
        if (state.variant) nextSearchParams.set('variant', state.variant)
        else nextSearchParams.delete('variant')
      }
      const nextSearch = nextSearchParams.size ? `?${nextSearchParams.toString()}` : ''
      return createResolvedReferenceTarget(
        'orisons',
        buildDatabaseOrisonPath(item),
        {kind: 'orison', item, variantId: nextSearchParams.get('variant') ?? undefined},
        nextSearch,
        true,
      )
    },
    resolveDetailRoute: async ({search, slug}) => {
      const {getOrisons} = await import('@/domain/orisons')
      const item = findOrisonByDatabaseSlug(getOrisons(), slug)
      const variantId = new URLSearchParams(search).get('variant') ?? undefined
      return {
        canonicalPath: item ? buildDatabaseOrisonPath(item) : buildDatabaseOrisonPath({name: slug}),
        routeItem: item ? {kind: 'orison', item, variantId} : null,
      }
    },
    loadBrowse: () =>
      import('@/features/database/browse/OrisonsBrowse').then(({OrisonsBrowse}) => ({
        default: OrisonsBrowse,
      })),
  },
} satisfies Record<DatabaseEntityId, DatabaseEntityRuntimeDefinition>

function buildCanonicalAwakenerRoutePath(
  awakener: {id: string; name: string},
  requestedSlug: string,
  tab: DatabaseAwakenerTab,
  lore?: AwakenerLoreRoute,
): string {
  const routeResolution = resolvePublicRoute('awakeners', requestedSlug.trim().toLowerCase())
  const basePath =
    routeResolution.status !== 'notFound' && routeResolution.ref.id === awakener.id
      ? routeResolution.canonicalPath
      : buildDatabaseAwakenerPath(awakener)
  const visibleTab = resolveDatabaseAwakenerVisibleTab(tab)
  return visibleTab === DEFAULT_DATABASE_AWAKENER_TAB
    ? basePath
    : `${basePath}/${visibleTab}${visibleTab === 'lore' ? `/${buildAwakenerLoreSuffix(lore)}` : ''}`
}

function sanitizeRuntimeSearch(
  entity: DatabaseEntityId,
  search: string,
  includeDetailState: boolean,
): string {
  return sanitizeDatabaseEntitySearch(entity, search, {includeDetailState})
}

function createResolvedReferenceTarget(
  entity: DatabaseEntityId,
  pathname: string,
  routeItem: DatabaseDetailRouteItem,
  search: string,
  searchAlreadySanitized = false,
): ResolvedDatabaseDetailReference {
  const nextSearch = searchAlreadySanitized ? search : sanitizeRuntimeSearch(entity, search, true)
  return {
    pathname,
    search: nextSearch,
    resolution: {canonicalPath: pathname, routeItem},
  }
}

const runtimeEntities = Object.keys(DATABASE_ENTITY_RUNTIME_BY_ID)
if (
  runtimeEntities.length !== DATABASE_ENTITY_DEFINITIONS.length ||
  DATABASE_ENTITY_DEFINITIONS.some(({entity}) => !(entity in DATABASE_ENTITY_RUNTIME_BY_ID))
) {
  throw new Error('Database entity runtime must cover every entity definition exactly once')
}

export function getDatabaseEntityRuntime(
  entity: DatabaseEntityId,
): DatabaseEntityRuntimeDefinition {
  return DATABASE_ENTITY_RUNTIME_BY_ID[entity]
}

export async function resolveDatabaseRuntimeDetailReference({
  defaultAwakenerTab,
  ref,
  search,
  state,
}: {
  defaultAwakenerTab: DatabaseAwakenerTab
  ref: EntityRef
  search: string
  state: DatabaseDetailNavigationState
}): Promise<ResolvedDatabaseDetailReference | null> {
  const definition = DATABASE_ENTITY_DEFINITIONS.find(({detailKind}) => detailKind === ref.kind)
  return definition
    ? getDatabaseEntityRuntime(definition.entity).resolveDetailReference({
        defaultAwakenerTab,
        id: ref.id,
        search,
        state,
      })
    : null
}
