import Fuse from 'fuse.js'

import {getAwakeners} from './awakeners'
import type {Posse} from './posses'
import {normalizeForSearch} from './search-utils'

const realmLabelById: Record<string, string> = {
  AEQUOR: 'Aequor',
  CARO: 'Caro',
  CHAOS: 'Chaos',
  ULTRA: 'Ultra',
  NEUTRAL: 'Neutral',
  OTHER: 'Other',
}

const awakeners = getAwakeners()
const awakenerByName = new Map(awakeners.map((awakener) => [awakener.name, awakener]))

function getRealmLabels(posse: Posse): string[] {
  if (posse.isFadedLegacy) {
    return ['Faded Legacy']
  }
  const normalizedRealm = posse.realm.trim().toUpperCase()
  return [realmLabelById[normalizedRealm] ?? posse.realm]
}

function getSearchableFields(posse: Posse): string[] {
  const linkedAwakener = posse.awakenerName ? awakenerByName.get(posse.awakenerName) : undefined
  return [
    posse.name,
    posse.id,
    posse.realm,
    ...getRealmLabels(posse),
    ...(posse.awakenerName ? [posse.awakenerName] : []),
    ...(linkedAwakener?.aliases ?? []),
  ]
}

export function searchPosses(posses: Posse[], query: string): Posse[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return posses
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  const exactMatches = posses.filter((posse) =>
    getSearchableFields(posse).some((field) => normalizeForSearch(field).includes(normalizedQuery)),
  )
  if (exactMatches.length > 0) {
    return exactMatches
  }

  const fuse = new Fuse(posses, {
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    keys: [
      {name: 'name', weight: 0.55},
      {name: 'id', weight: 0.15},
      {name: 'awakenerName', weight: 0.3},
    ],
  })

  const cutoff = /\s/.test(trimmedQuery) ? 0.55 : 0.3
  return fuse
    .search(trimmedQuery)
    .filter((result) => (result.score ?? 1) <= cutoff)
    .map((result) => result.item)
}
