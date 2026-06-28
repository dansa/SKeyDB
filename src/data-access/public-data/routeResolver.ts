import routesIndexJson from '@/data/public-v3/indexes/routes.json'

import type {
  EntityRef,
  PublicDataScope,
  PublicRouteIndexEntry,
  PublicRouteResolution,
  PublicRoutesIndex,
} from './contract'
import {publicRoutesIndexSchema} from './schemas'

let routesIndexCache: PublicRoutesIndex | undefined
const routeByEntityIdCache = new Map<PublicDataScope, Map<string, PublicRouteIndexEntry>>()

export function getPublicRoutesIndex(): PublicRoutesIndex {
  routesIndexCache ??= publicRoutesIndexSchema.parse(routesIndexJson)
  return routesIndexCache
}

export function findPublicRouteByEntityId(
  scope: PublicDataScope,
  entityId: string,
): PublicRouteIndexEntry | undefined {
  let routeByEntityId = routeByEntityIdCache.get(scope)
  if (!routeByEntityId) {
    routeByEntityId = new Map(
      Object.values(getPublicRoutesIndex().routes[scope] ?? {}).map((entry) => [entry.id, entry]),
    )
    routeByEntityIdCache.set(scope, routeByEntityId)
  }
  return routeByEntityId.get(entityId)
}

function normalizeRouteSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '')
}

function toResolution(status: 'ok' | 'redirect', entry: PublicRouteIndexEntry) {
  return {
    status,
    ref: {kind: entry.kind, id: entry.id} satisfies EntityRef,
    canonicalPath: entry.canonicalPath,
  }
}

export function resolvePublicRoute(scope: PublicDataScope, slug: string): PublicRouteResolution {
  const normalizedSlug = normalizeRouteSlug(slug)
  const routesIndex = getPublicRoutesIndex()
  const route = routesIndex.routes[scope]?.[normalizedSlug]
  if (route) {
    return toResolution('ok', route)
  }

  const redirect = routesIndex.redirects[scope]?.[normalizedSlug]
  if (redirect) {
    return toResolution('redirect', redirect)
  }

  return {
    status: 'notFound',
    scope,
    slug: normalizedSlug,
  }
}
