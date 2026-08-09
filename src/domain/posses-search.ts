import {posseSearchDocumentRepository} from '@/data-access/public-data/posseSearchRepository'

import type {Posse} from './posses'
import {createEntitySearch, type SearchOptions, type SearchResult} from './public-search'

const posseSearch = createEntitySearch<Posse>(getPosseSearchOptions())

export function searchPosses(posses: Posse[], query: string): Posse[] {
  return posseSearch.search(posses, query)
}

export function searchPosseResults(posses: Posse[], query: string): SearchResult<Posse>[] {
  return posseSearch.searchResults(posses, query)
}

function getPosseSearchOptions(): SearchOptions<Posse> {
  return {
    getDocument: (id) => posseSearchDocumentRepository.getDocument(id),
    getFallbackFields: (posse) => ({
      owner: [posse.ownerAwakenerName].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      ),
      facet: [posse.realm],
    }),
  }
}
