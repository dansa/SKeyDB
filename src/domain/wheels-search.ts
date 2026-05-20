import {
  searchPublicEntities,
  searchPublicEntityResults,
  type PublicSearchOptions,
  type PublicSearchResult,
} from './public-search'
import type {Wheel} from './wheels'

export function searchWheels(wheels: Wheel[], query: string): Wheel[] {
  return searchPublicEntities('wheels', wheels, query, getWheelSearchOptions())
}

export function searchWheelResults(wheels: Wheel[], query: string): PublicSearchResult<Wheel>[] {
  return searchPublicEntityResults('wheels', wheels, query, getWheelSearchOptions())
}

function getWheelSearchOptions(): PublicSearchOptions<Wheel> {
  return {
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
