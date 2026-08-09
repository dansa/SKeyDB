import {wheelSearchDocumentRepository} from '@/data-access/public-data/wheelSearchRepository'

import {createEntitySearch, type SearchOptions, type SearchResult} from './public-search'
import type {Wheel} from './wheels'

const wheelSearch = createEntitySearch<Wheel>(getWheelSearchOptions())

export function searchWheels(wheels: Wheel[], query: string): Wheel[] {
  return wheelSearch.search(wheels, query)
}

export function searchWheelResults(wheels: Wheel[], query: string): SearchResult<Wheel>[] {
  return wheelSearch.searchResults(wheels, query)
}

function getWheelSearchOptions(): SearchOptions<Wheel> {
  return {
    getDocument: (id) => wheelSearchDocumentRepository.getDocument(id),
    getFallbackFields: (wheel) => ({
      alias: wheel.aliases,
      owner: [wheel.ownerAwakenerName, wheel.awakener].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      ),
      tag: wheel.tags,
      facet: [wheel.realm, wheel.rarity],
    }),
  }
}
