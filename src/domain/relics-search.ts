import {
  searchPublicEntities,
  searchPublicEntityResults,
  type PublicSearchOptions,
  type PublicSearchResult,
} from './public-search'
import {getRelicDatabaseCategoryFilterLabel} from './relic-database-browse-state'
import type {Relic} from './relics'

export function searchRelics(relics: Relic[], query: string): Relic[] {
  return searchPublicEntities('relics', relics, query, getRelicSearchOptions())
}

export function searchRelicResults(relics: Relic[], query: string): PublicSearchResult<Relic>[] {
  return searchPublicEntityResults('relics', relics, query, getRelicSearchOptions())
}

function getRelicSearchOptions(): PublicSearchOptions<Relic> {
  return {
    getFallbackFields: (relic) => {
      const facets: string[] = [
        relic.relicType,
        ...relic.categories,
        ...relic.categories.map(getRelicDatabaseCategoryFilterLabel),
      ]
      if (relic.rarity) facets.unshift(relic.rarity)

      return {
        alias: relic.aliases,
        owner: relic.ownerAwakenerName ? [relic.ownerAwakenerName] : [],
        facet: facets,
      }
    },
  }
}
