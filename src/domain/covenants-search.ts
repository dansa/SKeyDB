import type {Covenant} from './covenants'
import {
  searchPublicEntities,
  searchPublicEntityResults,
  type PublicSearchResult,
} from './public-search'

export function searchCovenants(covenants: Covenant[], query: string): Covenant[] {
  return searchPublicEntities('covenants', covenants, query)
}

export function searchCovenantResults(
  covenants: Covenant[],
  query: string,
): PublicSearchResult<Covenant>[] {
  return searchPublicEntityResults('covenants', covenants, query)
}
