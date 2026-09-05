import {
  DATABASE_ENTITY_DEFINITIONS,
  type DatabaseEntityId,
} from '@/domain/database-entity-definitions'

import {getDatabaseEntityRuntime} from './databaseEntityRuntime'

export interface DatabaseDetailRouteRequest {
  defaultAwakenerTab: import('@/domain/database-paths').DatabaseAwakenerTab
  search: string
  slug: string
  suffixSegments: readonly string[]
}

export type ParsedDatabaseRoute =
  | {entity: DatabaseEntityId; kind: 'browse'}
  | {entity: DatabaseEntityId; kind: 'detail'; slug: string; suffixSegments: readonly string[]}
  | {entity: DatabaseEntityId; kind: 'invalid'}

const DEFAULT_DATABASE_ENTITY: DatabaseEntityId = 'awakeners'

function splitPathname(pathname: string): string[] | null {
  const segments = pathname.split('/').filter(Boolean)
  const decoded: string[] = []
  try {
    for (const segment of segments) decoded.push(decodeURIComponent(segment))
  } catch {
    return null
  }
  return decoded
}

function splitDefinitionPath(pathname: string): string[] {
  return pathname.split('/').filter(Boolean)
}

function startsWithSegments(value: readonly string[], prefix: readonly string[]): boolean {
  return prefix.every((segment, index) => value[index] === segment)
}

export function parseDatabaseRoutePath(pathname: string): ParsedDatabaseRoute {
  const pathSegments = splitPathname(pathname)
  if (pathSegments?.[0] !== 'database') {
    return {entity: DEFAULT_DATABASE_ENTITY, kind: 'invalid'}
  }

  for (const definition of DATABASE_ENTITY_DEFINITIONS) {
    const browseSegments = splitDefinitionPath(definition.browsePath)
    if (
      pathSegments.length === browseSegments.length &&
      startsWithSegments(pathSegments, browseSegments)
    ) {
      return {entity: definition.entity, kind: 'browse'}
    }
  }

  for (const definition of DATABASE_ENTITY_DEFINITIONS) {
    const prefixSegments = splitDefinitionPath(definition.detailPathPrefix)
    if (!startsWithSegments(pathSegments, prefixSegments)) continue

    const detailSegments = pathSegments.slice(prefixSegments.length)
    const [slug, ...suffixSegments] = detailSegments
    if (
      !slug ||
      (definition.entity === 'awakeners' &&
        suffixSegments.length > 1 &&
        suffixSegments[0]?.toLowerCase() !== 'lore') ||
      suffixSegments.length > getDatabaseEntityRuntime(definition.entity).maxDetailSuffixSegments
    ) {
      return {entity: definition.entity, kind: 'invalid'}
    }
    return {entity: definition.entity, kind: 'detail', slug, suffixSegments}
  }

  return {entity: DEFAULT_DATABASE_ENTITY, kind: 'invalid'}
}
