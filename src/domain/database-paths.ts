import {getPublicCatalogRecordById} from '@/data-access/public-data/catalogRepository'
import {resolvePublicRoute} from '@/data-access/public-data/routeResolver'

import type {Awakener} from './awakeners'
import type {Covenant} from './covenants'
import {
  buildDatabaseEntityBrowsePath,
  buildDatabaseEntityDetailPath,
  toDatabaseEntitySlug,
} from './database-entity-paths'
import type {Posse} from './posses'
import type {Wheel} from './wheels'

export const DATABASE_AWAKENER_TABS = [
  'overview',
  'upgrades',
  'skills',
  'builds',
  'teams',
  'lore',
] as const
export const DEFAULT_DATABASE_AWAKENER_TAB = 'upgrades' satisfies DatabaseAwakenerTab
export const DATABASE_AWAKENER_VISIBLE_TABS = ['upgrades', 'skills', 'teams', 'lore'] as const

export type DatabaseAwakenerTab = (typeof DATABASE_AWAKENER_TABS)[number]
export type DatabaseAwakenerVisibleTab = (typeof DATABASE_AWAKENER_VISIBLE_TABS)[number]

const DATABASE_AWAKENER_TAB_SET = new Set<string>(DATABASE_AWAKENER_TABS)
const DATABASE_AWAKENER_VISIBLE_TAB_SET = new Set<string>(DATABASE_AWAKENER_VISIBLE_TABS)

export function toDatabaseAwakenerSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabaseWheelSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabasePosseSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabaseCovenantSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function resolveDatabaseAwakenerTab(tab: string | undefined): DatabaseAwakenerTab | null {
  if (!tab) {
    return null
  }
  const normalizedTab = tab.trim().toLowerCase()
  if (normalizedTab === 'cards') {
    return 'skills'
  }
  return isDatabaseAwakenerTab(normalizedTab) ? normalizedTab : null
}

export function resolveDatabaseAwakenerVisibleTab(
  tab: DatabaseAwakenerTab | null | undefined,
): DatabaseAwakenerVisibleTab {
  return tab && DATABASE_AWAKENER_VISIBLE_TAB_SET.has(tab)
    ? (tab as DatabaseAwakenerVisibleTab)
    : DEFAULT_DATABASE_AWAKENER_TAB
}

function isDatabaseAwakenerTab(tab: string): tab is DatabaseAwakenerTab {
  return DATABASE_AWAKENER_TAB_SET.has(tab)
}

function getMatchingPublicEntityPath(id: string | undefined, name: string): string | undefined {
  if (!id) {
    return undefined
  }
  const entity = getPublicCatalogRecordById(id)
  if (!entity?.route) {
    return undefined
  }

  const expectedSlug = toDatabaseEntitySlug(name)
  if (entity.route.slug === expectedSlug || toDatabaseEntitySlug(entity.name) === expectedSlug) {
    return entity.route.canonicalPath
  }

  return undefined
}

export function buildDatabaseAwakenerPath(
  awakener: Pick<Awakener, 'name'> & Partial<Pick<Awakener, 'id'>>,
  tab: DatabaseAwakenerTab = DEFAULT_DATABASE_AWAKENER_TAB,
): string {
  const basePath =
    getMatchingPublicEntityPath(awakener.id, awakener.name) ??
    buildDatabaseEntityDetailPath('awakeners', toDatabaseAwakenerSlug(awakener.name))
  const visibleTab = resolveDatabaseAwakenerVisibleTab(tab)
  if (visibleTab === DEFAULT_DATABASE_AWAKENER_TAB) {
    return basePath
  }
  return `${basePath}/${visibleTab}`
}

export function buildDatabaseWheelBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('wheels')
}

export function buildDatabasePosseBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('posses')
}

export function buildDatabaseCovenantBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('covenants')
}

export function buildDatabaseWheelPath(
  wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>,
): string {
  return (
    getMatchingPublicEntityPath(wheel.id, wheel.name) ??
    buildDatabaseEntityDetailPath('wheels', toDatabaseWheelSlug(wheel.name))
  )
}

export function buildDatabasePossePath(
  posse: Pick<Posse, 'name'> & Partial<Pick<Posse, 'id'>>,
): string {
  return (
    getMatchingPublicEntityPath(posse.id, posse.name) ??
    buildDatabaseEntityDetailPath('posses', toDatabasePosseSlug(posse.name))
  )
}

export function buildDatabaseCovenantPath(
  covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>,
): string {
  return (
    getMatchingPublicEntityPath(covenant.id, covenant.name) ??
    buildDatabaseEntityDetailPath('covenants', toDatabaseCovenantSlug(covenant.name))
  )
}

export function findAwakenerByDatabaseSlug(
  awakeners: Awakener[],
  slug: string | undefined,
): Awakener | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  const resolution = resolvePublicRoute('awakeners', normalizedSlug)
  if (resolution.status !== 'notFound') {
    return awakeners.find((awakener) => awakener.id === resolution.ref.id) ?? null
  }
  return (
    awakeners.find((awakener) => toDatabaseAwakenerSlug(awakener.name) === normalizedSlug) ?? null
  )
}

export function findWheelByDatabaseSlug(wheels: Wheel[], slug: string | undefined): Wheel | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  const resolution = resolvePublicRoute('wheels', normalizedSlug)
  if (resolution.status !== 'notFound') {
    return wheels.find((wheel) => wheel.id === resolution.ref.id) ?? null
  }
  return wheels.find((wheel) => toDatabaseWheelSlug(wheel.name) === normalizedSlug) ?? null
}

export function findPosseByDatabaseSlug(posses: Posse[], slug: string | undefined): Posse | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  const resolution = resolvePublicRoute('posses', normalizedSlug)
  if (resolution.status !== 'notFound') {
    return posses.find((posse) => posse.id === resolution.ref.id) ?? null
  }
  return posses.find((posse) => toDatabasePosseSlug(posse.name) === normalizedSlug) ?? null
}

export function findCovenantByDatabaseSlug(
  covenants: Covenant[],
  slug: string | undefined,
): Covenant | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  const resolution = resolvePublicRoute('covenants', normalizedSlug)
  if (resolution.status !== 'notFound') {
    return covenants.find((covenant) => covenant.id === resolution.ref.id) ?? null
  }
  return (
    covenants.find((covenant) => toDatabaseCovenantSlug(covenant.name) === normalizedSlug) ?? null
  )
}
