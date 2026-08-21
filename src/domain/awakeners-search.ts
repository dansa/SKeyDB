import {awakenerSearchDocumentRepository} from '@/data-access/public-data/awakenerSearchRepository'

import type {Awakener} from './awakeners'
import {createEntitySearch, type SearchOptions, type SearchResult} from './public-search'

const awakenerSearch = createEntitySearch<Awakener>(getAwakenerSearchOptions())

export function searchAwakeners(awakeners: Awakener[], query: string): Awakener[] {
  return awakenerSearch.search(awakeners, query)
}

export function searchAwakenerResults(
  awakeners: Awakener[],
  query: string,
): SearchResult<Awakener>[] {
  return awakenerSearch.searchResults(awakeners, query)
}

function getAwakenerSearchOptions(): SearchOptions<Awakener> {
  return {
    getDocument: (id) => awakenerSearchDocumentRepository.getDocument(id),
    getFallbackFields: (awakener) => ({
      alias: toOptionalStringArray(awakener.aliases),
      tag: toOptionalStringArray(awakener.tags),
      facet: [
        awakener.realm,
        awakener.rarity,
        awakener.type,
        awakener.gender,
        awakener.faction,
      ].filter((value): value is string => typeof value === 'string' && value.length > 0),
    }),
  }
}

function toOptionalStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}
