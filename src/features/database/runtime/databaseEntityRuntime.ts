import type {ComponentType} from 'react'

import {parseDatabaseBrowseState, patchDatabaseBrowseState} from '@/domain/database-browse-state'
import {
  DATABASE_ENTITY_DEFINITIONS,
  type DatabaseEntityId,
} from '@/domain/database-entity-definitions'
import {
  parseRelicDatabaseBrowseState,
  patchRelicDatabaseBrowseState,
} from '@/domain/relic-database-browse-state'
import {
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
} from '@/domain/simple-artifact-database-browse-state'
import {
  parseWheelsDatabaseBrowseState,
  patchWheelsDatabaseBrowseState,
} from '@/domain/wheels-database-browse-state'
import type {EntityBrowseProps} from '@/features/database/browse/EntityBrowseShared'

interface DatabaseEntityRuntimeDefinition {
  loadBrowse: () => Promise<{default: ComponentType<EntityBrowseProps>}>
  sanitizeSearchParams: (
    searchParams: URLSearchParams,
    options: {includeDetailState: boolean},
  ) => URLSearchParams
}

const DATABASE_ENTITY_RUNTIME_BY_ID = {
  awakeners: {
    sanitizeSearchParams: (searchParams) =>
      patchDatabaseBrowseState(new URLSearchParams(), parseDatabaseBrowseState(searchParams)),
    loadBrowse: () =>
      import('@/features/database/browse/AwakenersBrowse').then(({AwakenersBrowse}) => ({
        default: AwakenersBrowse,
      })),
  },
  wheels: {
    sanitizeSearchParams: (searchParams) =>
      patchWheelsDatabaseBrowseState(
        new URLSearchParams(),
        parseWheelsDatabaseBrowseState(searchParams),
      ),
    loadBrowse: () =>
      import('@/features/database/browse/WheelsBrowse').then(({WheelsBrowse}) => ({
        default: WheelsBrowse,
      })),
  },
  posses: {
    sanitizeSearchParams: (searchParams) =>
      patchPosseDatabaseBrowseState(
        new URLSearchParams(),
        parsePosseDatabaseBrowseState(searchParams),
      ),
    loadBrowse: () =>
      import('@/features/database/browse/PossesBrowse').then(({PossesBrowse}) => ({
        default: PossesBrowse,
      })),
  },
  covenants: {
    sanitizeSearchParams: (searchParams) =>
      patchCovenantDatabaseBrowseState(
        new URLSearchParams(),
        parseCovenantDatabaseBrowseState(searchParams),
      ),
    loadBrowse: () =>
      import('@/features/database/browse/CovenantsBrowse').then(({CovenantsBrowse}) => ({
        default: CovenantsBrowse,
      })),
  },
  relics: {
    sanitizeSearchParams: (searchParams, {includeDetailState}) => {
      const sanitized = patchRelicDatabaseBrowseState(
        new URLSearchParams(),
        parseRelicDatabaseBrowseState(searchParams),
      )
      const variantId = searchParams.get('variant')?.trim()
      if (includeDetailState && variantId && /^relic-variant-\d{4}$/.test(variantId)) {
        sanitized.set('variant', variantId)
      }
      return sanitized
    },
    loadBrowse: () =>
      import('@/features/database/browse/RelicsBrowse').then(({RelicsBrowse}) => ({
        default: RelicsBrowse,
      })),
  },
} satisfies Record<DatabaseEntityId, DatabaseEntityRuntimeDefinition>

const runtimeEntities = Object.keys(DATABASE_ENTITY_RUNTIME_BY_ID)
if (
  runtimeEntities.length !== DATABASE_ENTITY_DEFINITIONS.length ||
  DATABASE_ENTITY_DEFINITIONS.some(({entity}) => !(entity in DATABASE_ENTITY_RUNTIME_BY_ID))
) {
  throw new Error('Database entity runtime must cover every entity definition exactly once')
}

export function getDatabaseEntityRuntime(
  entity: DatabaseEntityId,
): DatabaseEntityRuntimeDefinition {
  return DATABASE_ENTITY_RUNTIME_BY_ID[entity]
}
