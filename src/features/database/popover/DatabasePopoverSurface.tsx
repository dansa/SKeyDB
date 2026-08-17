import {useMemo, type ReactNode} from 'react'

import {buildGlobalDatabaseReferenceLayer} from '@/domain/global-database-reference-layer'

import {DatabasePopoverContext} from '../internal/database-popover-context'
import {DatabasePopoverRoot} from '../internal/DatabasePopoverRoot'
import {useDatabaseDetailPreferences} from '../internal/useDatabaseDetailPreferences'
import {useDatabasePopoverController} from '../internal/useDatabasePopoverController'
import {
  DatabasePopoverSurfaceContext,
  type DatabasePopoverSurfaceActions,
} from './database-popover-surface-context'

export function DatabasePopoverSurface({children}: {children: ReactNode}) {
  const referenceLayer = useMemo(() => buildGlobalDatabaseReferenceLayer(), [])
  const popoverController = useDatabasePopoverController({referenceLayer, stats: null})
  const {preferences} = useDatabaseDetailPreferences()
  const openRootInfo = popoverController.contextValue.openRootInfo

  const surfaceActions = useMemo<DatabasePopoverSurfaceActions>(() => {
    if (!openRootInfo) {
      throw new Error('Database popover controller does not provide an info entry action.')
    }
    return {openRootInfo}
  }, [openRootInfo])

  return (
    <DatabasePopoverSurfaceContext.Provider value={surfaceActions}>
      <DatabasePopoverContext.Provider value={popoverController.contextValue}>
        {children}
        <DatabasePopoverRoot
          {...popoverController.popoverRootProps}
          closeOnOutsideClick={preferences.shared.clickOutsideClosesPopovers}
        />
      </DatabasePopoverContext.Provider>
    </DatabasePopoverSurfaceContext.Provider>
  )
}
