import type {Posse} from './posses'
import {
  searchPublicEntities,
  searchPublicEntityResults,
  type PublicSearchOptions,
  type PublicSearchResult,
} from './public-search'

export function searchPosses(posses: Posse[], query: string): Posse[] {
  return searchPublicEntities('posses', posses, query, getPosseSearchOptions())
}

export function searchPosseResults(posses: Posse[], query: string): PublicSearchResult<Posse>[] {
  return searchPublicEntityResults('posses', posses, query, getPosseSearchOptions())
}

function getPosseSearchOptions(): PublicSearchOptions<Posse> {
  return {
    getFallbackFields: (posse) => ({
      owner: [posse.ownerAwakenerName].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      ),
      facet: [posse.realm],
    }),
  }
}
