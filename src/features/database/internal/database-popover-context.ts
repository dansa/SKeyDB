import {createContext, use} from 'react'

import type {AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {DatabaseReferenceInfo} from '@/domain/database-reference-layer'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'

export interface DatabasePopoverAnchorEvent {
  currentTarget: HTMLElement
  stopPropagation: () => void
}

export interface DatabasePopoverDescriptionRankContext {
  descriptionRank?: number
  descriptionMaxRank?: number
  descriptionRankMode?: 'static' | 'current'
}

export interface DatabasePopoverContextValue {
  openRootInfo?: (entry: KeyedDatabaseReferenceEntry, event: DatabasePopoverAnchorEvent) => void
  openRootReferenceByName: (
    name: string,
    event: DatabasePopoverAnchorEvent,
    referenceKind?: DatabaseReferenceInfo['kind'],
  ) => void
  openRootOverlay: (
    overlay: AwakenerOverlayRecord,
    event: DatabasePopoverAnchorEvent,
    rankContext?: DatabasePopoverDescriptionRankContext,
  ) => void
  openNestedReferenceByName: (name: string, referenceKind?: DatabaseReferenceInfo['kind']) => void
  openNestedOverlay: (
    overlay: AwakenerOverlayRecord,
    rankContext?: DatabasePopoverDescriptionRankContext,
  ) => void
  hasOpenPopovers: boolean
  closeAllPopovers: () => void
}

export const DatabasePopoverContext = createContext<DatabasePopoverContextValue | null>(null)

export function useDatabasePopoverControllerContext(): DatabasePopoverContextValue | null {
  return use(DatabasePopoverContext)
}
