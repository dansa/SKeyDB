import type {ReactNode} from 'react'

import {DatabasePopoverRoot} from '@/features/database/internal/DatabasePopoverRoot'
import {PopoverProvider} from '@/features/database/internal/usePopoverStore'

import {useDZoneDatabasePopovers} from './useDZoneDatabasePopovers'

export type DZonePopoverController = ReturnType<typeof useDZoneDatabasePopovers>

interface DZonePopoverSurfaceProps {
  children: (dzonePopovers: DZonePopoverController) => ReactNode
}

function DZonePopoverInner({children}: DZonePopoverSurfaceProps) {
  const dzonePopovers = useDZoneDatabasePopovers()
  return (
    <>
      {children(dzonePopovers)}
      <DatabasePopoverRoot
        {...dzonePopovers.popoverRootProps}
        closeOnOutsideClick={dzonePopovers.closeOnOutsideClick}
      />
    </>
  )
}

export function DZonePopoverSurface({children}: DZonePopoverSurfaceProps) {
  return (
    <PopoverProvider>
      <DZonePopoverInner>{children}</DZonePopoverInner>
    </PopoverProvider>
  )
}
