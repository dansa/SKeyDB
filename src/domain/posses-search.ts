import type {Posse} from './posses'
import {searchPublicEntities, type PublicSearchOptions} from './public-search'

export function searchPosses(posses: Posse[], query: string): Posse[] {
  return searchPublicEntities('posses', posses, query, getPosseSearchOptions())
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
