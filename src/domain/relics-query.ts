import type {Relic, RelicCategory, RelicRarity, RelicType} from './relics'
import {searchRelics} from './relics-search'

export interface RelicQuery {
  query?: string
  category?: RelicCategory
  rarity?: RelicRarity
  relicType?: RelicType
  ownerAwakenerId?: string
}

export function queryRelics(relics: Relic[], query: RelicQuery): Relic[] {
  const searched = searchRelics(relics, query.query ?? '')

  return searched.filter((relic) => {
    if (query.category && !relic.categories.includes(query.category)) return false
    if (query.rarity && relic.rarity !== query.rarity) return false
    if (query.relicType && relic.relicType !== query.relicType) return false
    if (query.ownerAwakenerId && relic.ownerAwakenerId !== query.ownerAwakenerId) return false
    return true
  })
}
