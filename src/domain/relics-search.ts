import {relicSearchDocumentRepository} from '@/data-access/public-data/relicSearchRepository'

import {createEntitySearch, type SearchOptions, type SearchResult} from './public-search'
import {getRelicDatabaseCategoryFilterLabel} from './relic-database-browse-state'
import type {Relic} from './relics'

const relicSearch = createEntitySearch<Relic>(getRelicSearchOptions())

export function searchRelics(relics: Relic[], query: string): Relic[] {
  return relicSearch.search(relics, query)
}

export function searchRelicResults(relics: Relic[], query: string): SearchResult<Relic>[] {
  return relicSearch.searchResults(relics, query)
}

function getRelicSearchOptions(): SearchOptions<Relic> {
  return {
    getDocument: (id) => relicSearchDocumentRepository.getDocument(id),
    getFallbackFields: (relic) => {
      const facets: string[] = [
        relic.relicType,
        ...relic.categories,
        ...relic.categories.map(getRelicDatabaseCategoryFilterLabel),
      ]

      return {
        alias: relic.aliases,
        owner: relic.ownerAwakenerName ? [relic.ownerAwakenerName] : [],
        facet: facets,
      }
    },
  }
}
