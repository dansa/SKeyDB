import type {Awakener} from './awakeners'

function trimEdgeDashes(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && value[start] === '-') {
    start += 1
  }
  while (end > start && value[end - 1] === '-') {
    end -= 1
  }
  return value.slice(start, end)
}

export function toDatabaseAwakenerSlug(name: string): string {
  return trimEdgeDashes(
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-'),
  )
}

export function buildDatabaseAwakenerPath(awakener: Pick<Awakener, 'name'>): string {
  return `/database/awk/${toDatabaseAwakenerSlug(awakener.name)}`
}

export function findAwakenerByDatabaseSlug(
  awakeners: Awakener[],
  slug: string | undefined,
): Awakener | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  return (
    awakeners.find((awakener) => toDatabaseAwakenerSlug(awakener.name) === normalizedSlug) ?? null
  )
}
