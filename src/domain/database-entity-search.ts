import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {getDatabaseEntityRuntime} from '@/features/database/runtime/databaseEntityRuntime'

export function sanitizeDatabaseEntitySearch(
  entity: DatabaseEntityId,
  search: string,
  {includeDetailState = false}: {includeDetailState?: boolean} = {},
): string {
  const searchParams = new URLSearchParams(search)
  const sanitizedParams = getDatabaseEntityRuntime(entity).sanitizeSearchParams(searchParams, {
    includeDetailState,
  })
  const sanitizedSearch = sanitizedParams.toString()

  return sanitizedSearch ? `?${sanitizedSearch}` : ''
}
