import type {PublicSearchableEntity, PublicSearchResult} from './public-search'

export function getSearchRelevanceByEntityId<TEntity extends PublicSearchableEntity>(
  results: PublicSearchResult<TEntity>[],
  query: string,
): ReadonlyMap<string, number> | undefined {
  if (query.trim().length === 0) {
    return undefined
  }

  return new Map(results.map((result) => [result.entity.id, result.relevance]))
}

export function compareSearchRelevance<TEntity extends PublicSearchableEntity>(
  left: TEntity,
  right: TEntity,
  relevanceByEntityId: ReadonlyMap<string, number> | undefined,
): number {
  if (!relevanceByEntityId) {
    return 0
  }

  return (
    (relevanceByEntityId.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
    (relevanceByEntityId.get(right.id) ?? Number.MAX_SAFE_INTEGER)
  )
}
