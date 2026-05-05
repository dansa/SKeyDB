import {getMainstatByKey} from '../mainstats'
import type {Wheel} from '../wheels'

export {formatAwakenerNameForUi} from '../name-format'
export {getRealmAccent, getRealmIcon, getRealmLabel, normalizeRealmId} from '../realms'
export {
  buildDatabaseEntityBrowsePath,
  buildDatabaseEntityDetailPath,
  toDatabaseEntitySlug,
  type DatabaseEntityId,
} from '../database-entity-paths'
export {
  buildDatabaseAwakenerPath,
  buildDatabaseCovenantBrowsePath,
  buildDatabaseCovenantPath,
  buildDatabasePosseBrowsePath,
  buildDatabasePossePath,
  buildDatabaseWheelBrowsePath,
  buildDatabaseWheelPath,
  resolveDatabaseAwakenerTab,
  toDatabaseAwakenerSlug,
  toDatabaseCovenantSlug,
  toDatabasePosseSlug,
  toDatabaseWheelSlug,
  type DatabaseAwakenerTab,
} from '../database-paths'
export {getTypeFilterLabel} from '../database-browse-state'
export {getPosseDatabaseRealmFilterLabel} from '../simple-artifact-database-browse-state'

export function getWheelMainstatLabel(wheel: Pick<Wheel, 'mainstatKey'>): string {
  return getMainstatByKey(wheel.mainstatKey)?.label ?? ''
}
