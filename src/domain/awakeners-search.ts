import Fuse from 'fuse.js'
import type { Awakener } from './awakeners'

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getSearchableFields(awakener: Awakener): string[] {
  return [awakener.name, awakener.faction, ...awakener.aliases]
}

export function searchAwakeners(awakeners: Awakener[], query: string): Awakener[] {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length === 0) {
    return awakeners
  }

  const normalizedQuery = normalizeForSearch(trimmedQuery)
  const exactMatches = awakeners.filter((awakener) =>
    getSearchableFields(awakener).some((field) => normalizeForSearch(field).includes(normalizedQuery)),
  )
  if (exactMatches.length > 0) {
    return exactMatches
  }

  const fuse = new Fuse(awakeners, {
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    keys: [
      { name: 'name', weight: 0.8 },
      { name: 'aliases', weight: 0.2 },
    ],
  })
  const cutoff = /\s/.test(trimmedQuery) ? 0.55 : 0.3
  return fuse
    .search(trimmedQuery)
    .filter((result) => (result.score ?? 1) <= cutoff)
    .map((result) => result.item)
}
