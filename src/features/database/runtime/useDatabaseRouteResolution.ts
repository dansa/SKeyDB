import {useEffect, useMemo, useState} from 'react'

import type {DatabaseAwakenerTab} from '@/domain/database-paths'

import {getDatabaseEntityRuntime, type ResolvedDatabaseDetailRoute} from './databaseEntityRuntime'
import {parseDatabaseRoutePath, type ParsedDatabaseRoute} from './databaseRouteResolution'

type DatabaseRouteResolutionState =
  | {error: unknown; key: string; status: 'error'}
  | {key: string; status: 'loading'}
  | {key: string; resolution: ResolvedDatabaseDetailRoute; status: 'resolved'}
  | {key: ''; status: 'idle'}

const primedRouteResolutions = new Map<string, ResolvedDatabaseDetailRoute>()
const MAX_PRIMED_ROUTE_RESOLUTIONS = 32

function createResolutionKey(route: ParsedDatabaseRoute, search: string): string {
  return route.kind === 'detail'
    ? `${route.entity}:${route.slug}:${route.suffixSegments.join('/')}:${search}`
    : ''
}

export function primeDatabaseRouteResolution(
  pathname: string,
  search: string,
  resolution: ResolvedDatabaseDetailRoute,
): void {
  const parsedRoute = pathnameToParsedRoute(pathname)
  const key = createResolutionKey(parsedRoute, search)
  if (!key) return
  primedRouteResolutions.delete(key)
  primedRouteResolutions.set(key, resolution)
  if (primedRouteResolutions.size > MAX_PRIMED_ROUTE_RESOLUTIONS) {
    const oldestKey = primedRouteResolutions.keys().next().value
    if (oldestKey) primedRouteResolutions.delete(oldestKey)
  }
}

export function clearPrimedDatabaseRouteResolutionsForTests(): void {
  primedRouteResolutions.clear()
}

function pathnameToParsedRoute(pathname: string): ParsedDatabaseRoute {
  // Kept behind a tiny function so navigation can prime the same cache used by the hook.
  return parseDatabaseRoutePath(pathname)
}

export function useDatabaseRouteResolution({
  defaultAwakenerTab,
  route,
  search,
}: {
  defaultAwakenerTab: DatabaseAwakenerTab
  route: ParsedDatabaseRoute
  search: string
}): DatabaseRouteResolutionState {
  const key = createResolutionKey(route, search)
  const detailEntity = route.entity
  const detailSlug = route.kind === 'detail' ? route.slug : ''
  const detailSuffixKey = route.kind === 'detail' ? JSON.stringify(route.suffixSegments) : '[]'
  const request = useMemo(
    () => ({
      defaultAwakenerTab,
      search,
      slug: detailSlug,
      suffixSegments: JSON.parse(detailSuffixKey) as string[],
    }),
    [defaultAwakenerTab, detailSlug, detailSuffixKey, search],
  )
  const primedResolution = primedRouteResolutions.get(key)
  const [state, setState] = useState<DatabaseRouteResolutionState>(() =>
    primedResolution
      ? {key, resolution: primedResolution, status: 'resolved'}
      : route.kind === 'detail'
        ? {key, status: 'loading'}
        : {key: '', status: 'idle'},
  )

  useEffect(() => {
    if (route.kind !== 'detail') return

    const primed = primedRouteResolutions.get(key)
    if (primed) {
      return
    }

    let active = true
    const runtime = getDatabaseEntityRuntime(detailEntity)
    void runtime
      .resolveDetailRoute(request)
      .then((resolution) => {
        if (active) setState({key, resolution, status: 'resolved'})
      })
      .catch((error: unknown) => {
        if (active) setState({error, key, status: 'error'})
      })

    return () => {
      active = false
    }
  }, [detailEntity, key, request, route.kind])

  if (route.kind !== 'detail') return {key: '', status: 'idle'}
  if (primedResolution) return {key, resolution: primedResolution, status: 'resolved'}
  if (state.key === key) return state
  return {key, status: 'loading'}
}
