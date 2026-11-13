import {
  buildDatabaseEntityBrowsePath,
  DATABASE_ENTITY_IDS,
  getDatabaseBrowsePathForLocation,
  type DatabaseEntityId,
} from '@/domain/database-entity-paths'

const DATABASE_DETAIL_FROM_BROWSE_STATE_KEY = '__databaseDetailFromBrowse'
const DATABASE_DETAIL_HISTORY_DEPTH_KEY = '__databaseDetailHistoryDepth'

export interface DatabaseDetailBrowseOrigin {
  entity: DatabaseEntityId
  pathname: string
  search: string
}

function isStateRecord(state: unknown): state is Record<string, unknown> {
  return typeof state === 'object' && state !== null && !Array.isArray(state)
}

function isDatabaseEntityId(value: unknown): value is DatabaseEntityId {
  return DATABASE_ENTITY_IDS.some((entity) => entity === value)
}

export function createDatabaseDetailFromBrowseState(
  state: unknown,
  origin: DatabaseDetailBrowseOrigin,
): Record<string, unknown> {
  return {
    ...(isStateRecord(state) ? state : {}),
    [DATABASE_DETAIL_FROM_BROWSE_STATE_KEY]: origin,
    [DATABASE_DETAIL_HISTORY_DEPTH_KEY]: 1,
  }
}

export function getDatabaseDetailBrowseOrigin(state: unknown): DatabaseDetailBrowseOrigin | null {
  if (!isStateRecord(state)) {
    return null
  }

  const origin = state[DATABASE_DETAIL_FROM_BROWSE_STATE_KEY]
  if (
    !isStateRecord(origin) ||
    !isDatabaseEntityId(origin.entity) ||
    typeof origin.pathname !== 'string' ||
    typeof origin.search !== 'string' ||
    origin.pathname !== buildDatabaseEntityBrowsePath(origin.entity)
  ) {
    return null
  }

  return {
    entity: origin.entity,
    pathname: origin.pathname,
    search: origin.search,
  }
}

export function getDatabaseDetailHistoryDepth(state: unknown): number {
  if (!isStateRecord(state)) return 0
  const depth = state[DATABASE_DETAIL_HISTORY_DEPTH_KEY]
  return typeof depth === 'number' && Number.isSafeInteger(depth) && depth > 0
    ? depth
    : getDatabaseDetailBrowseOrigin(state)
      ? 1
      : 0
}

export function advanceDatabaseDetailHistory(state: unknown): unknown {
  const depth = getDatabaseDetailHistoryDepth(state)
  return {...(isStateRecord(state) ? state : {}), [DATABASE_DETAIL_HISTORY_DEPTH_KEY]: depth + 1}
}

export function getDatabaseRouteBoundaryKey(pathname: string, state: unknown): string {
  return (
    getDatabaseDetailBrowseOrigin(state)?.pathname ??
    getDatabaseBrowsePathForLocation(pathname) ??
    pathname
  )
}
