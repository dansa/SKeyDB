import type {ReactNode} from 'react'

import {DatabasePopoverSurface as PublicDatabasePopoverSurface} from '@/features/database/popover'

import {useDZoneDatabasePopovers} from './useDZoneDatabasePopovers'

export type DZonePopoverController = ReturnType<typeof useDZoneDatabasePopovers>

interface DZonePopoverSurfaceProps {
  children: (dzonePopovers: DZonePopoverController) => ReactNode
}

export function DZonePopoverSurface({children}: DZonePopoverSurfaceProps) {
  return (
    <PublicDatabasePopoverSurface>
      <DZonePopoverSurfaceContent>{children}</DZonePopoverSurfaceContent>
    </PublicDatabasePopoverSurface>
  )
}

function DZonePopoverSurfaceContent({children}: DZonePopoverSurfaceProps) {
  const dzonePopovers = useDZoneDatabasePopovers()

  return children(dzonePopovers)
}
