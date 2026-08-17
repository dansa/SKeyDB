import {
  DATABASE_ENTITY_DEFINITIONS,
  getDatabaseEntityDefinition,
  type DatabaseEntityId,
} from '@/domain/database-entity-definitions'

export const DATABASE_ENTITY_IDS = DATABASE_ENTITY_DEFINITIONS.map(({entity}) => entity)

export type {DatabaseEntityId} from '@/domain/database-entity-definitions'

function trimEdgeDashes(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') {
    start += 1
  }
  while (end > start && value[end - 1] === '-') {
    end -= 1
  }
  return value.slice(start, end)
}

export function toDatabaseEntitySlug(name: string): string {
  return trimEdgeDashes(
    name
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-'),
  )
}

export function buildDatabaseEntityBrowsePath(entity: DatabaseEntityId): string {
  return getDatabaseEntityDefinition(entity).browsePath
}

export function buildDatabaseEntityDetailPath(entity: DatabaseEntityId, slug: string): string {
  return `${getDatabaseEntityDefinition(entity).detailPathPrefix}/${slug}`
}

export function getDatabaseBrowsePathForLocation(pathname: string): string | null {
  for (const {browsePath, detailPathPrefix} of DATABASE_ENTITY_DEFINITIONS) {
    if (pathname === browsePath || pathname.startsWith(`${detailPathPrefix}/`)) {
      return browsePath
    }
  }

  return null
}
