import {useMemo, type MouseEvent} from 'react'

import {createPortal} from 'react-dom'

import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {ResolvedAwakenerDatabaseShellView} from '@/domain/awakeners-database-view'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import {resolveLiveTrailEntry, resolveNavigationHandler} from './database-popover-controller-model'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {DatabasePopoverPortal, type DatabasePopoverPortalEntry} from './DatabasePopoverPortal'
import type {TrailEntry} from './popover-trail'
import {
  usePopoverFloating,
  usePopoverTrail,
  type DatabasePopoverDescriptionRankContext,
  type EventWithRect,
} from './usePopoverStore'

interface PopoverNestedActions {
  openNestedInfoFrom: (
    sourceIndex: number,
    entry: KeyedDatabaseReferenceEntry,
    event?: EventWithRect,
  ) => void
  openNestedOverlayFrom: (
    sourceIndex: number,
    overlay: AwakenerOverlayRecord,
    rankContext?: DatabasePopoverDescriptionRankContext,
    event?: EventWithRect,
  ) => void
  openNestedReferenceByNameFrom: (sourceIndex: number, name: string, event?: EventWithRect) => void
}

function getLogicalDepth(entry: TrailEntry, allEntries: TrailEntry[]): number {
  const entriesByKey = new Map(allEntries.map((e) => [e.key, e]))
  let depth = 0
  let current = entry
  const visited = new Set<string>()
  while (current.parentKey) {
    if (visited.has(current.key)) {
      break
    }
    visited.add(current.key)
    const parent = entriesByKey.get(current.parentKey)
    if (!parent || parent.key === current.key) {
      break
    }
    depth += 1
    current = parent
  }
  return depth
}

function buildPopoverPortalEntry({
  clearTrail,
  closeTrailFrom,
  entry,
  index,
  logicalDepth,
  nestedActions,
  onNavigateToCovenantPage,
  onNavigateToSkills,
  onNavigateToWheelPage,
  referenceLayer,
  selectedEnlightenSlot,
  currentDescriptionRankContext,
}: {
  clearTrail: () => void
  closeTrailFrom: (index: number) => void
  entry: TrailEntry
  index: number
  logicalDepth: number
  nestedActions: PopoverNestedActions
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  currentDescriptionRankContext?: DatabasePopoverDescriptionRankContext
}): DatabasePopoverPortalEntry {
  const activeEntry = resolveLiveTrailEntry({
    entry,
    currentRankContext: currentDescriptionRankContext,
    referenceLayer,
    selectedEnlightenSlot,
  })
  const activeEntryId = activeEntry.referenceId ?? activeEntry.key
  const navigationHandler = resolveNavigationHandler({
    activeEntryId,
    handlers: {
      onNavigateToCovenantPage,
      onNavigateToSkills,
      onNavigateToWheelPage,
    },
    navigationTarget: activeEntry.navigationTarget,
  })
  const onNavigate = navigationHandler
    ? () => {
        navigationHandler(clearTrail)
      }
    : undefined
  return {
    activeEntry,
    key: entry.key,
    layerIndex: logicalDepth,
    onClose: () => {
      closeTrailFrom(index)
    },
    onInfoEntryClick: (nextEntry: KeyedDatabaseReferenceEntry, event?: MouseEvent) => {
      nestedActions.openNestedInfoFrom(index, nextEntry, event)
    },
    onMechanicTokenClick: (
      overlay: AwakenerOverlayRecord,
      rankContext?: DatabasePopoverDescriptionRankContext,
      event?: MouseEvent,
    ) => {
      nestedActions.openNestedOverlayFrom(index, overlay, rankContext, event)
    },
    onNavigate,
    onSkillTokenClick: (name: string, event?: MouseEvent) => {
      nestedActions.openNestedReferenceByNameFrom(index, name, event)
    },
    referenceLayer: activeEntry.referenceLayerOverride ?? referenceLayer,
  }
}

function getPopoverPortalRoot(anchorElement?: HTMLElement | null): Element {
  if (typeof window !== 'undefined' && window.innerWidth <= 767) {
    if (anchorElement?.isConnected) {
      const dialogOverlay = anchorElement.closest('[data-detail-modal-overlay]')
      if (dialogOverlay) return dialogOverlay
    }
    const dialogOverlays = document.querySelectorAll('[data-detail-modal-overlay]')
    if (dialogOverlays.length > 0) {
      return dialogOverlays[dialogOverlays.length - 1]
    }
    return document.body
  }

  if (anchorElement?.isConnected) {
    const closest =
      anchorElement.closest('[data-detail-modal-shell]') ??
      anchorElement.closest('[data-modal-frame-dialog]') ??
      anchorElement.closest('[data-detail-modal-overlay]')
    if (closest) return closest
  }
  const shells = document.querySelectorAll(
    '[data-detail-modal-shell], [data-modal-frame-dialog], [data-detail-modal-overlay]',
  )
  if (shells.length > 0) {
    return shells[shells.length - 1]
  }
  return document.body
}

export interface DatabasePopoverRootProps {
  anchorElement?: HTMLElement | null
  anchorRect: DOMRect | null
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  stats: ResolvedAwakenerDatabaseShellView['stats']
  closeOnOutsideClick?: boolean
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  currentDescriptionRankContext?: DatabasePopoverDescriptionRankContext
  showTagIcons?: boolean
  showVisibleScaling?: boolean
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  nestedActions: PopoverNestedActions
  onCloseAll: () => void
  closeTrailFrom: (index: number) => void
}

export function DatabasePopoverRoot({
  anchorElement,
  anchorRect,
  referenceLayer,
  formulaContext,
  stats,
  closeOnOutsideClick = false,
  onToggleEnlightenSlot,
  selectedEnlightenSlot = null,
  currentDescriptionRankContext,
  onNavigateToSkills,
  onNavigateToWheelPage,
  onNavigateToCovenantPage,
  nestedActions,
  onCloseAll,
  closeTrailFrom,
}: DatabasePopoverRootProps) {
  const trail = usePopoverTrail()
  const floating = usePopoverFloating()

  const allEntries = useMemo(() => [...floating, ...trail], [floating, trail])

  const entries = useMemo<DatabasePopoverPortalEntry[]>(() => {
    return allEntries.map((entry, index) => {
      const logicalDepth = getLogicalDepth(entry, allEntries)
      return buildPopoverPortalEntry({
        clearTrail: onCloseAll,
        closeTrailFrom,
        entry,
        index,
        logicalDepth,
        nestedActions,
        onNavigateToCovenantPage,
        onNavigateToSkills,
        onNavigateToWheelPage,
        referenceLayer,
        selectedEnlightenSlot,
        currentDescriptionRankContext,
      })
    })
  }, [
    allEntries,
    onCloseAll,
    closeTrailFrom,
    nestedActions,
    onNavigateToCovenantPage,
    onNavigateToSkills,
    onNavigateToWheelPage,
    referenceLayer,
    selectedEnlightenSlot,
    currentDescriptionRankContext,
  ])

  if (entries.length === 0) {
    return null
  }

  return createPortal(
    <DatabasePopoverPortal
      anchorElement={anchorElement}
      anchorRect={anchorRect}
      entries={entries}
      formulaContext={formulaContext}
      closeOnOutsideClick={closeOnOutsideClick}
      onCloseAll={onCloseAll}
      onToggleEnlightenSlot={onToggleEnlightenSlot}
      referenceLayer={referenceLayer}
      selectedEnlightenSlot={selectedEnlightenSlot}
      stats={stats}
    />,
    getPopoverPortalRoot(anchorElement),
  )
}
