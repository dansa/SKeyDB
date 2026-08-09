import {createContext, use} from 'react'

import type {DatabasePopoverAnchorEvent} from '../internal/database-popover-context'
import type {KeyedDatabaseReferenceEntry} from '../internal/database-reference-entry'

export type DatabasePopoverEntry = KeyedDatabaseReferenceEntry
export type DatabasePopoverAnchor = DatabasePopoverAnchorEvent

export interface DatabasePopoverSurfaceActions {
  openRootInfo: (entry: DatabasePopoverEntry, event: DatabasePopoverAnchor) => void
}

export const DatabasePopoverSurfaceContext = createContext<DatabasePopoverSurfaceActions | null>(
  null,
)

export function useDatabasePopoverSurface(): DatabasePopoverSurfaceActions {
  const actions = use(DatabasePopoverSurfaceContext)
  if (!actions) {
    throw new Error('useDatabasePopoverSurface must be used inside DatabasePopoverSurface.')
  }
  return actions
}
