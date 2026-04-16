import {useCallback, useEffect, useId, useMemo, useState, type MouseEvent} from 'react'

import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import {
  buildAwakenerDatabaseOverlayLabel,
  resolveAwakenerDatabaseReferenceInfo,
  resolveAwakenerDatabaseReferenceInfoById,
} from '@/domain/awakeners-database-reference-info'
import {
  type DatabaseReferenceInfo,
  type ResolvedAwakenerDatabaseReferenceLayer,
} from '@/domain/awakeners-database-view'

import type {DatabasePopoverContextValue} from './database-popover-context'
import type {DatabasePopoverRootProps} from './DatabasePopoverRoot'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {
  closeTrailFromIndex,
  insertTrailEntryAfterIndex,
  isSameTrailRoot,
  openTrailRoot,
  type TrailEntry,
} from './popover-trail'

interface DatabasePopoverControllerOptions {
  referenceLayer: ResolvedAwakenerDatabaseReferenceLayer | null
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  stats?: import('@/domain/awakener-source-schema').FullStats | null
  onNavigateToCards?: () => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function useDatabasePopoverController({
  referenceLayer,
  selectedEnlightenSlot = null,
  stats = null,
  onNavigateToCards,
  onToggleEnlightenSlot,
  showVisibleScaling = true,
  showTagIcons = true,
}: DatabasePopoverControllerOptions) {
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailAnchorRect, setTrailAnchorRect] = useState<DOMRect | null>(null)
  const [trailAnchorElement, setTrailAnchorElement] = useState<HTMLElement | null>(null)
  const ownerId = useId()

  const clearTrail = useCallback(() => {
    setTrail([])
    setTrailAnchorRect(null)
    setTrailAnchorElement(null)
  }, [])

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      clearTrail()
    }

    window.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    return () => {
      window.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    }
  }, [clearTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const buildTrailEntry = useCallback(
    (
      reference: DatabaseReferenceInfo,
      selectedEnlightenSlot: TrailEntry['selectedEnlightenSlot'],
    ): TrailEntry => ({
      key: `${reference.kind}:${reference.id}`,
      referenceId: reference.id,
      name: reference.name,
      label: reference.label,
      description: reference.description,
      keywordFooterText: reference.keywordFooterText,
      record: reference.record,
      descriptionRank: reference.descriptionRank,
      descriptionMaxRank: reference.descriptionMaxRank,
      influenceBadges: reference.influenceBadges,
      selectedEnlightenSlot,
      supportsNavigateToCards: reference.kind === 'skill',
    }),
    [],
  )

  const buildSelectedTrailEntry = useCallback(
    (reference: DatabaseReferenceInfo) => buildTrailEntry(reference, selectedEnlightenSlot),
    [buildTrailEntry, selectedEnlightenSlot],
  )

  const resolveReferenceByName = useCallback(
    (name: string) =>
      referenceLayer ? resolveAwakenerDatabaseReferenceInfo(referenceLayer, name) : null,
    [referenceLayer],
  )

  const buildOverlayFallbackEntry = useCallback(
    (overlay: AwakenerOverlayRecord): TrailEntry => ({
      key: `overlay:${overlay.id}`,
      referenceId: overlay.id,
      name: overlay.displayName,
      label: buildAwakenerDatabaseOverlayLabel(overlay),
      description: overlay.descriptionTemplate,
      record: overlay,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      supportsNavigateToCards: false,
    }),
    [],
  )

  const buildOverlayEntry = useCallback(
    (overlay: AwakenerOverlayRecord): TrailEntry => {
      const info = resolveReferenceByName(overlay.displayName)
      if (!info) {
        return buildOverlayFallbackEntry(overlay)
      }
      return buildSelectedTrailEntry(info)
    },
    [buildOverlayFallbackEntry, buildSelectedTrailEntry, resolveReferenceByName],
  )

  const openRootTrailEntry = useCallback(
    (entry: TrailEntry, event: MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      if (isSameTrailRoot(trail, entry.key)) {
        return
      }
      const anchorElement = event.currentTarget as HTMLElement
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(anchorElement.getBoundingClientRect())
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, trail],
  )

  const openRootReferenceByName = useCallback(
    (name: string, event: MouseEvent<HTMLElement>) => {
      const reference = resolveReferenceByName(name)
      if (!reference) {
        return
      }
      openRootTrailEntry(buildSelectedTrailEntry(reference), event)
    },
    [buildSelectedTrailEntry, openRootTrailEntry, resolveReferenceByName],
  )

  const openRootInfo = useCallback(
    (entry: KeyedDatabaseReferenceEntry, event: MouseEvent<HTMLElement>) => {
      openRootTrailEntry(
        {
          ...entry,
          supportsNavigateToCards: false,
        },
        event,
      )
    },
    [openRootTrailEntry],
  )

  const openRootOverlay = useCallback(
    (overlay: AwakenerOverlayRecord, event: MouseEvent<HTMLElement>) => {
      openRootTrailEntry(buildOverlayEntry(overlay), event)
    },
    [buildOverlayEntry, openRootTrailEntry],
  )

  const openNestedReferenceByName = useCallback(
    (name: string) => {
      const reference = resolveReferenceByName(name)
      if (!reference) {
        return
      }
      const entry = buildSelectedTrailEntry(reference)
      setTrail((prev) => insertTrailEntryAfterIndex(prev, prev.length - 1, entry))
    },
    [buildSelectedTrailEntry, resolveReferenceByName],
  )

  const openNestedOverlay = useCallback(
    (overlay: AwakenerOverlayRecord) => {
      const entry = buildOverlayEntry(overlay)
      setTrail((prev) => insertTrailEntryAfterIndex(prev, prev.length - 1, entry))
    },
    [buildOverlayEntry],
  )

  const openNestedReferenceByNameFrom = useCallback(
    (sourceIndex: number, name: string) => {
      const reference = resolveReferenceByName(name)
      if (!reference) {
        return
      }
      const entry = buildSelectedTrailEntry(reference)
      setTrail((prev) => insertTrailEntryAfterIndex(prev, sourceIndex, entry))
    },
    [buildSelectedTrailEntry, resolveReferenceByName],
  )

  const openNestedInfoFrom = useCallback((sourceIndex: number, entry: KeyedDatabaseReferenceEntry) => {
    setTrail((prev) =>
      insertTrailEntryAfterIndex(prev, sourceIndex, {
        ...entry,
        supportsNavigateToCards: false,
      }),
    )
  }, [])

  const openNestedOverlayFrom = useCallback(
    (sourceIndex: number, overlay: AwakenerOverlayRecord) => {
      const entry = buildOverlayEntry(overlay)
      setTrail((prev) => insertTrailEntryAfterIndex(prev, sourceIndex, entry))
    },
    [buildOverlayEntry],
  )

  const closeTrailFrom = useCallback((index: number) => {
    setTrail((prev) => {
      const next = closeTrailFromIndex(prev, index)
      if (next.length === 0) {
        setTrailAnchorRect(null)
        setTrailAnchorElement(null)
      }
      return next
    })
  }, [])

  const resolveLiveTrailEntry = useCallback(
    (entry: TrailEntry): TrailEntry => {
      if (!referenceLayer) {
        return entry
      }
      if (!entry.referenceId) {
        return entry
      }
      const liveReference = resolveAwakenerDatabaseReferenceInfoById(
        referenceLayer,
        entry.referenceId,
      )
      return liveReference ? buildSelectedTrailEntry(liveReference) : entry
    },
    [buildSelectedTrailEntry, referenceLayer],
  )

  const contextValue = useMemo<DatabasePopoverContextValue>(
    () => ({
      openRootInfo,
      openRootReferenceByName,
      openRootOverlay,
      openNestedReferenceByName,
      openNestedOverlay,
      hasOpenPopovers: trail.length > 0,
      closeAllPopovers: clearTrail,
    }),
    [
      clearTrail,
      openNestedOverlay,
      openNestedReferenceByName,
      openRootInfo,
      openRootOverlay,
      openRootReferenceByName,
      trail.length,
    ],
  )

  const popoverRootProps = useMemo<DatabasePopoverRootProps>(
    () => ({
      anchorElement: trailAnchorElement,
      anchorRect: trailAnchorRect,
      referenceLayer,
      stats,
      entries: trail.map((entry, index) => {
        const activeEntry = resolveLiveTrailEntry(entry)

        return {
          activeEntry,
          key: entry.key,
          layerIndex: index,
          onClose: () => {
            closeTrailFrom(index)
          },
          onInfoEntryClick: (nextEntry: KeyedDatabaseReferenceEntry) => {
            openNestedInfoFrom(index, nextEntry)
          },
          onMechanicTokenClick: (overlay: AwakenerOverlayRecord) => {
            openNestedOverlayFrom(index, overlay)
          },
          onNavigateToCards:
            activeEntry.supportsNavigateToCards && onNavigateToCards
              ? () => {
                  clearTrail()
                  onNavigateToCards()
                }
              : undefined,
          onSkillTokenClick: (name: string) => {
            openNestedReferenceByNameFrom(index, name)
          },
        }
      }),
      onCloseAll: clearTrail,
      onToggleEnlightenSlot,
      selectedEnlightenSlot,
      showTagIcons,
      showVisibleScaling,
    }),
    [
      clearTrail,
      closeTrailFrom,
      onNavigateToCards,
      onToggleEnlightenSlot,
      openNestedInfoFrom,
      openNestedOverlayFrom,
      openNestedReferenceByNameFrom,
      referenceLayer,
      resolveLiveTrailEntry,
      selectedEnlightenSlot,
      showTagIcons,
      showVisibleScaling,
      stats,
      trail,
      trailAnchorElement,
      trailAnchorRect,
    ],
  )

  return {
    contextValue,
    hasOpenPopovers: trail.length > 0,
    closeAllPopovers: clearTrail,
    popoverRootProps,
  }
}
