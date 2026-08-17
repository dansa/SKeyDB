import {covenantSearchDocumentRepository} from '@/data-access/public-data/covenantSearchRepository'

import type {Covenant} from './covenants'
import {createEntitySearch, type SearchResult} from './public-search'

const covenantSearch = createEntitySearch<Covenant>({
  getDocument: (id) => covenantSearchDocumentRepository.getDocument(id),
})

export function searchCovenants(covenants: Covenant[], query: string): Covenant[] {
  return covenantSearch.search(covenants, query)
}

export function searchCovenantResults(
  covenants: Covenant[],
  query: string,
): SearchResult<Covenant>[] {
  return covenantSearch.searchResults(covenants, query)
}
