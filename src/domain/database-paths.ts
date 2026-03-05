import type { Awakener } from './awakeners'

export function toDatabaseAwakenerSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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
  return awakeners.find((awakener) => toDatabaseAwakenerSlug(awakener.name) === normalizedSlug) ?? null
}
