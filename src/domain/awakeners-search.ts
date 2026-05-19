import {
  getAwakenerScalingSubstatSearchLabels,
  isAwakenerScalingSubstatKey,
} from './awakener-scaling-substats'
import type {Awakener} from './awakeners'
import {
  searchPublicEntities,
  searchPublicEntityResults,
  type PublicSearchOptions,
  type PublicSearchResult,
} from './public-search'

export function searchAwakeners(awakeners: Awakener[], query: string): Awakener[] {
  return searchPublicEntities('awakeners', awakeners, query, getAwakenerSearchOptions())
}

export function searchAwakenerResults(
  awakeners: Awakener[],
  query: string,
): PublicSearchResult<Awakener>[] {
  return searchPublicEntityResults('awakeners', awakeners, query, getAwakenerSearchOptions())
}

function getAwakenerSearchOptions(): PublicSearchOptions<Awakener> {
  return {
    getFallbackFields: (awakener) => ({
      alias: toOptionalStringArray(awakener.aliases),
      tag: [...toOptionalStringArray(awakener.tags), ...getScalingSubstatSearchLabels(awakener)],
      facet: [awakener.realm, awakener.rarity, awakener.type, awakener.faction].filter(
        (value): value is string => typeof value === 'string' && value.length > 0,
      ),
    }),
  }
}

function getScalingSubstatSearchLabels(awakener: Awakener): string[] {
  const labels: string[] = []
  for (const [key, value] of Object.entries(awakener.substatScaling ?? {})) {
    if (typeof value === 'number' && value > 0 && isAwakenerScalingSubstatKey(key)) {
      labels.push(...getAwakenerScalingSubstatSearchLabels(key))
    }
  }
  return labels
}

function toOptionalStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : []
}
