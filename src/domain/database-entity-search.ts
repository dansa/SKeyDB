import type {DatabaseEntityId} from '@/domain/database-entity-paths'

import {sanitizeDatabaseEntitySearchParams} from './database-entity-query-codecs'

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
