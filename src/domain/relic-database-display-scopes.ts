import type {Relic, RelicCategory} from './relics'

export const RELIC_DATABASE_DISPLAY_SCOPE_IDS = [
  'STANDARD',
  'DIMENSIONAL_IMAGE',
  'OTHER',
  'EVENT',
  'PENDULUM',
] as const

export type RelicDatabaseDisplayScopeId = (typeof RELIC_DATABASE_DISPLAY_SCOPE_IDS)[number]

export const DEFAULT_RELIC_DATABASE_DISPLAY_SCOPES: readonly RelicDatabaseDisplayScopeId[] = [
  'STANDARD',
  'DIMENSIONAL_IMAGE',
  'OTHER',
]

export function normalizeRelicDisplayScopes(
  scopes: readonly RelicDatabaseDisplayScopeId[],
): RelicDatabaseDisplayScopeId[] {
  return RELIC_DATABASE_DISPLAY_SCOPE_IDS.filter((scope) => scopes.includes(scope))
}

const SCOPE_CATEGORIES: Record<RelicDatabaseDisplayScopeId, readonly RelicCategory[]> = {
  STANDARD: ['ASTRAL_REIGN', 'FADED_LEGACY'],
  DIMENSIONAL_IMAGE: ['DIMENSIONAL_IMAGE'],
  OTHER: ['OTHER'],
  EVENT: ['EVENT'],
  PENDULUM: ['PENDULUM'],
}

export function getRelicDatabaseDisplayScopeLabel(scope: RelicDatabaseDisplayScopeId): string {
  switch (scope) {
    case 'STANDARD':
      return 'Standard'
    case 'DIMENSIONAL_IMAGE':
      return 'Dimensional'
    case 'OTHER':
      return 'Other'
    case 'EVENT':
      return 'Events'
    case 'PENDULUM':
      return 'Pendulum'
  }
}

export function getRelicDisplayScopes(relic: Pick<Relic, 'categories'>) {
  const categorySet = new Set(relic.categories)
  return RELIC_DATABASE_DISPLAY_SCOPE_IDS.filter((scope) =>
    SCOPE_CATEGORIES[scope].some((category) => categorySet.has(category)),
  )
}

export function isRelicInDisplayScopes(
  relic: Pick<Relic, 'categories'>,
  activeScopes: readonly RelicDatabaseDisplayScopeId[],
): boolean {
  const activeScopeSet = new Set(activeScopes)
  return getRelicDisplayScopes(relic).some((scope) => activeScopeSet.has(scope))
}

export function mergeRelicDisplayScopesForMatches(
  activeScopes: readonly RelicDatabaseDisplayScopeId[],
  relics: readonly Pick<Relic, 'categories'>[],
): RelicDatabaseDisplayScopeId[] {
  const nextScopes = new Set(activeScopes)
  for (const relic of relics) {
    for (const scope of getRelicDisplayScopes(relic)) nextScopes.add(scope)
  }
  return RELIC_DATABASE_DISPLAY_SCOPE_IDS.filter((scope) => nextScopes.has(scope))
}
