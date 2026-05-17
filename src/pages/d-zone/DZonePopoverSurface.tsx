import type {ReactNode} from 'react'

import {DatabasePopoverContext} from '@/features/database/internal/database-popover-context'
import {DatabasePopoverRoot} from '@/features/database/internal/DatabasePopoverRoot'

import {useDZoneDatabasePopovers} from './useDZoneDatabasePopovers'

export type DZonePopoverController = ReturnType<typeof useDZoneDatabasePopovers>

interface DZonePopoverSurfaceProps {
  children: (dzonePopovers: DZonePopoverController) => ReactNode
}

export function DZonePopoverSurface({children}: DZonePopoverSurfaceProps) {
  const dzonePopovers = useDZoneDatabasePopovers()

  return (
    <DatabasePopoverContext.Provider value={dzonePopovers.contextValue}>
      {children(dzonePopovers)}
      <DatabasePopoverRoot
        {...dzonePopovers.popoverRootProps}
        closeOnOutsideClick={dzonePopovers.closeOnOutsideClick}
      />
    </DatabasePopoverContext.Provider>
  )
}
