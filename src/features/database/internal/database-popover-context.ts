import {createContext, useContext} from 'react'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

export interface DatabasePopoverAnchorEvent {
  currentTarget: HTMLElement
  stopPropagation: () => void
}

export interface DatabasePopoverDescriptionRankContext {
  descriptionRank?: number
  descriptionMaxRank?: number
}

export interface DatabasePopoverContextValue {
  openRootInfo?: (entry: KeyedDatabaseReferenceEntry, event: DatabasePopoverAnchorEvent) => void
  openRootReferenceByName: (name: string, event: DatabasePopoverAnchorEvent) => void
  openRootOverlay: (
    overlay: AwakenerOverlayRecord,
    event: DatabasePopoverAnchorEvent,
    rankContext?: DatabasePopoverDescriptionRankContext,
  ) => void
  openNestedReferenceByName: (name: string) => void
  openNestedOverlay: (overlay: AwakenerOverlayRecord) => void
  hasOpenPopovers: boolean
  closeAllPopovers: () => void
}

export const DatabasePopoverContext = createContext<DatabasePopoverContextValue | null>(null)

export function useDatabasePopoverControllerContext(): DatabasePopoverContextValue | null {
  return useContext(DatabasePopoverContext)
}
