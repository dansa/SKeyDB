import {parseDatabaseBrowseState, patchDatabaseBrowseState} from './database-browse-state'
import {DATABASE_ENTITY_DEFINITIONS, type DatabaseEntityId} from './database-entity-definitions'
import {
  parseRelicDatabaseBrowseState,
  patchRelicDatabaseBrowseState,
} from './relic-database-browse-state'
import {
  parseCovenantDatabaseBrowseState,
  parsePosseDatabaseBrowseState,
  patchCovenantDatabaseBrowseState,
  patchPosseDatabaseBrowseState,
} from './simple-artifact-database-browse-state'
import {
  parseWheelsDatabaseBrowseState,
  patchWheelsDatabaseBrowseState,
} from './wheels-database-browse-state'

export interface DatabaseEntityQueryCodecOptions {
  includeDetailState: boolean
}

interface DatabaseEntityQueryCodec {
  sanitize: (
    searchParams: URLSearchParams,
    options: DatabaseEntityQueryCodecOptions,
  ) => URLSearchParams
}

const DATABASE_ENTITY_QUERY_CODEC_BY_ID = {
  awakeners: {
    sanitize: (searchParams) =>
      patchDatabaseBrowseState(new URLSearchParams(), parseDatabaseBrowseState(searchParams)),
  },
  wheels: {
    sanitize: (searchParams) =>
      patchWheelsDatabaseBrowseState(
        new URLSearchParams(),
        parseWheelsDatabaseBrowseState(searchParams),
      ),
  },
  posses: {
    sanitize: (searchParams) =>
      patchPosseDatabaseBrowseState(
        new URLSearchParams(),
        parsePosseDatabaseBrowseState(searchParams),
      ),
  },
  covenants: {
    sanitize: (searchParams) =>
      patchCovenantDatabaseBrowseState(
        new URLSearchParams(),
        parseCovenantDatabaseBrowseState(searchParams),
      ),
  },
  relics: {
    sanitize: (searchParams, {includeDetailState}) => {
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
  },
} satisfies Record<DatabaseEntityId, DatabaseEntityQueryCodec>

const queryCodecEntities = Object.keys(DATABASE_ENTITY_QUERY_CODEC_BY_ID)
if (
  queryCodecEntities.length !== DATABASE_ENTITY_DEFINITIONS.length ||
  DATABASE_ENTITY_DEFINITIONS.some(({entity}) => !(entity in DATABASE_ENTITY_QUERY_CODEC_BY_ID))
) {
  throw new Error('Database entity query codecs must cover every entity definition exactly once')
}

export function sanitizeDatabaseEntitySearchParams(
  entity: DatabaseEntityId,
  searchParams: URLSearchParams,
  options: DatabaseEntityQueryCodecOptions,
): URLSearchParams {
  return DATABASE_ENTITY_QUERY_CODEC_BY_ID[entity].sanitize(searchParams, options)
}
