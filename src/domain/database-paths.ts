import {PUBLIC_DATA_SCOPES, type PublicDataScope} from '@/data-access/public-data/contract'
import {
  findPublicRouteByEntityId,
  resolvePublicRoute,
} from '@/data-access/public-data/routeResolver'
import {getDatabaseEntityPublicDataScope} from '@/domain/database-entity-definitions'

import {buildAwakenerLoreSuffix, type AwakenerLoreRoute} from './awakener-lore-routes'
import type {Awakener} from './awakeners'
import type {Covenant} from './covenants'
import {
  buildDatabaseEntityBrowsePath,
  buildDatabaseEntityDetailPath,
  toDatabaseEntitySlug,
  type DatabaseEntityId,
} from './database-entity-paths'
import type {Orison} from './orisons'
import type {Posse} from './posses'
import type {Relic} from './relics'
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
export const DATABASE_AWAKENER_VISIBLE_TABS = ['upgrades', 'skills', 'builds', 'lore'] as const

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

export function toDatabaseRelicSlug(name: string): string {
  return toDatabaseEntitySlug(name)
}

export function toDatabaseOrisonSlug(name: string): string {
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

function getMatchingPublicEntityPath(
  scope: PublicDataScope,
  id: string | undefined,
  name: string,
): string | undefined {
  if (!id) {
    return undefined
  }
  const route = findPublicRouteByEntityId(scope, id)
  if (!route) {
    return undefined
  }

  const expectedSlug = toDatabaseEntitySlug(name)
  if (route.canonicalSlug === expectedSlug) {
    return route.canonicalPath
  }

  return undefined
}

interface DatabasePathEntity {
  id?: string
  name: string
}

function buildDatabaseEntityPath(entity: DatabaseEntityId, item: DatabasePathEntity): string {
  const publicDataScope = asPublicDataScope(getDatabaseEntityPublicDataScope(entity))
  return (
    (publicDataScope
      ? getMatchingPublicEntityPath(publicDataScope, item.id, item.name)
      : undefined) ?? buildDatabaseEntityDetailPath(entity, toDatabaseEntitySlug(item.name))
  )
}

function findEntityByDatabaseSlug<T extends {id: string; name: string}>(
  entity: DatabaseEntityId,
  items: readonly T[],
  slug: string | undefined,
): T | null {
  if (!slug) {
    return null
  }
  const normalizedSlug = slug.trim().toLowerCase()
  const publicDataScope = asPublicDataScope(getDatabaseEntityPublicDataScope(entity))
  if (publicDataScope) {
    const resolution = resolvePublicRoute(publicDataScope, normalizedSlug)
    if (resolution.status !== 'notFound') {
      return items.find((item) => item.id === resolution.ref.id) ?? null
    }
  }
  return items.find((item) => toDatabaseEntitySlug(item.name) === normalizedSlug) ?? null
}

function asPublicDataScope(scope: string | undefined): PublicDataScope | undefined {
  return PUBLIC_DATA_SCOPES.includes(scope as PublicDataScope)
    ? (scope as PublicDataScope)
    : undefined
}

export function buildDatabaseAwakenerPath(
  awakener: Pick<Awakener, 'name'> & Partial<Pick<Awakener, 'id'>>,
  tab: DatabaseAwakenerTab = DEFAULT_DATABASE_AWAKENER_TAB,
  lore?: AwakenerLoreRoute,
): string {
  const basePath = buildDatabaseEntityPath('awakeners', awakener)
  const visibleTab = resolveDatabaseAwakenerVisibleTab(tab)
  if (visibleTab === DEFAULT_DATABASE_AWAKENER_TAB) {
    return basePath
  }
  return `${basePath}/${visibleTab}${visibleTab === 'lore' ? `/${buildAwakenerLoreSuffix(lore)}` : ''}`
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

export function buildDatabaseRelicBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('relics')
}

export function buildDatabaseOrisonBrowsePath(): string {
  return buildDatabaseEntityBrowsePath('orisons')
}

export function buildDatabaseWheelPath(
  wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>,
): string {
  return buildDatabaseEntityPath('wheels', wheel)
}

export function buildDatabasePossePath(
  posse: Pick<Posse, 'name'> & Partial<Pick<Posse, 'id'>>,
): string {
  return buildDatabaseEntityPath('posses', posse)
}

export function buildDatabaseCovenantPath(
  covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>,
): string {
  return buildDatabaseEntityPath('covenants', covenant)
}

export function buildDatabaseRelicPath(
  relic: Pick<Relic, 'name'> & Partial<Pick<Relic, 'id'>>,
): string {
  return buildDatabaseEntityPath('relics', relic)
}

export function buildDatabaseOrisonPath(
  orison: Pick<Orison, 'name'> & Partial<Pick<Orison, 'id'>>,
): string {
  return buildDatabaseEntityPath('orisons', orison)
}

export function findAwakenerByDatabaseSlug(
  awakeners: Awakener[],
  slug: string | undefined,
): Awakener | null {
  return findEntityByDatabaseSlug('awakeners', awakeners, slug)
}

export function findWheelByDatabaseSlug(wheels: Wheel[], slug: string | undefined): Wheel | null {
  return findEntityByDatabaseSlug('wheels', wheels, slug)
}

export function findPosseByDatabaseSlug(posses: Posse[], slug: string | undefined): Posse | null {
  return findEntityByDatabaseSlug('posses', posses, slug)
}

export function findCovenantByDatabaseSlug(
  covenants: Covenant[],
  slug: string | undefined,
): Covenant | null {
  return findEntityByDatabaseSlug('covenants', covenants, slug)
}

export function findRelicByDatabaseSlug(relics: Relic[], slug: string | undefined): Relic | null {
  return findEntityByDatabaseSlug('relics', relics, slug)
}

export function findOrisonByDatabaseSlug(
  orisons: Orison[],
  slug: string | undefined,
): Orison | null {
  return findEntityByDatabaseSlug('orisons', orisons, slug)
}
