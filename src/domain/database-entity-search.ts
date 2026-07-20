import {parseDatabaseBrowseState, patchDatabaseBrowseState} from '@/domain/database-browse-state'
import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {
  parseRelicDatabaseBrowseState,
  patchRelicDatabaseBrowseState,
} from '@/domain/relic-database-browse-state'
import {
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
} from '@/domain/simple-artifact-database-browse-state'
import {
  parseWheelsDatabaseBrowseState,
  patchWheelsDatabaseBrowseState,
} from '@/domain/wheels-database-browse-state'

export function sanitizeDatabaseEntitySearch(
  entity: DatabaseEntityId,
  search: string,
  {includeDetailState = false}: {includeDetailState?: boolean} = {},
): string {
  const searchParams = new URLSearchParams(search)
  const sanitizedParams = sanitizeDatabaseEntitySearchParams(entity, searchParams, {
    includeDetailState,
  })
  const sanitizedSearch = sanitizedParams.toString()

  return sanitizedSearch ? `?${sanitizedSearch}` : ''
}

function sanitizeDatabaseEntitySearchParams(
  entity: DatabaseEntityId,
  searchParams: URLSearchParams,
  {includeDetailState}: {includeDetailState: boolean},
): URLSearchParams {
  if (entity === 'wheels') {
    return patchWheelsDatabaseBrowseState(
      new URLSearchParams(),
      parseWheelsDatabaseBrowseState(searchParams),
    )
  }

  if (entity === 'posses') {
    return patchPosseDatabaseBrowseState(
      new URLSearchParams(),
      parsePosseDatabaseBrowseState(searchParams),
    )
  }

  if (entity === 'covenants') {
    return patchCovenantDatabaseBrowseState(
      new URLSearchParams(),
      parseCovenantDatabaseBrowseState(searchParams),
    )
  }

  if (entity === 'relics') {
    const sanitized = patchRelicDatabaseBrowseState(
      new URLSearchParams(),
      parseRelicDatabaseBrowseState(searchParams),
    )
    const variantId = searchParams.get('variant')?.trim()
    if (includeDetailState && variantId && /^relic-variant-\d{4}$/.test(variantId)) {
      sanitized.set('variant', variantId)
    }
    return sanitized
  }

  return patchDatabaseBrowseState(new URLSearchParams(), parseDatabaseBrowseState(searchParams))
}
