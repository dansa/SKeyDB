import {lazy, type ReactNode} from 'react'

import {DATABASE_ENTITY_DEFINITIONS} from '@/domain/database-entity-definitions'
import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {getDatabaseEntityRuntime} from '@/features/database/runtime/databaseEntityRuntime'

import type {EntityBrowseProps} from './EntityBrowseShared'

const BROWSE_COMPONENT_BY_ENTITY = Object.fromEntries(
  DATABASE_ENTITY_DEFINITIONS.map((definition) => [
    definition.entity,
    lazy(getDatabaseEntityRuntime(definition.entity).loadBrowse),
  ]),
) as Record<DatabaseEntityId, ReturnType<typeof lazy>>

export function EntityBrowseLoader({
  entity,
  ...props
}: EntityBrowseProps & {entity: DatabaseEntityId}): ReactNode {
  const BrowseComponent = BROWSE_COMPONENT_BY_ENTITY[entity]
  return <BrowseComponent {...props} />
}
