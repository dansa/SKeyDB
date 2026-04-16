import {createContext, useContext, type MouseEvent} from 'react'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

export interface DatabasePopoverContextValue {
  openRootInfo?: (entry: KeyedDatabaseReferenceEntry, event: MouseEvent<HTMLElement>) => void
  openRootReferenceByName: (name: string, event: MouseEvent<HTMLElement>) => void
  openRootOverlay: (overlay: AwakenerOverlayRecord, event: MouseEvent<HTMLElement>) => void
  openNestedReferenceByName: (name: string) => void
  openNestedOverlay: (overlay: AwakenerOverlayRecord) => void
  hasOpenPopovers: boolean
  closeAllPopovers: () => void
}

export const DatabasePopoverContext = createContext<DatabasePopoverContextValue | null>(null)

export function useDatabasePopoverControllerContext(): DatabasePopoverContextValue | null {
  return useContext(DatabasePopoverContext)
}
