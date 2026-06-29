export const DATABASE_ENTITY_IDS = ['awakeners', 'wheels', 'posses', 'covenants'] as const

export type DatabaseEntityId = (typeof DATABASE_ENTITY_IDS)[number]

interface DatabaseEntityPathConfig {
  browsePath: string
  detailPathPrefix: string
}

const DATABASE_ENTITY_PATH_CONFIG: Record<DatabaseEntityId, DatabaseEntityPathConfig> = {
  awakeners: {
    browsePath: '/database',
    detailPathPrefix: '/database/awakeners',
  },
  wheels: {
    browsePath: '/database/wheels',
    detailPathPrefix: '/database/wheels',
  },
  posses: {
    browsePath: '/database/posses',
    detailPathPrefix: '/database/posses',
  },
  covenants: {
    browsePath: '/database/covenants',
    detailPathPrefix: '/database/covenants',
  },
}

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
  return DATABASE_ENTITY_PATH_CONFIG[entity].browsePath
}

export function buildDatabaseEntityDetailPath(entity: DatabaseEntityId, slug: string): string {
  return `${DATABASE_ENTITY_PATH_CONFIG[entity].detailPathPrefix}/${slug}`
}
