import {useCallback, useEffect, useId, useMemo, useState, type MouseEvent} from 'react'

import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import {
  resolveDatabaseReferenceInfo,
  resolveDatabaseReferenceInfoById,
} from '@/domain/database-reference-info'
import {
  buildDatabaseOverlayLabel,
  type DatabaseReferenceInfo,
  type DatabaseReferenceLayer,
  type ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'

import type {DatabasePopoverContextValue} from './database-popover-context'
import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import type {DatabasePopoverRootProps} from './DatabasePopoverRoot'
import {
  closeTrailFromIndex,
  insertTrailEntryAfterIndex,
  isSameTrailRoot,
  openTrailRoot,
  type TrailEntry,
} from './popover-trail'

interface DatabasePopoverControllerOptions {
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  stats?: import('@/domain/awakener-source-schema').FullStats | null
  onNavigateToCards?: () => void
  onNavigateToWheelPage?: (wheel: {name: string}) => void
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
  onNavigateToWheelPage,
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
      referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
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
      navigationTarget:
        reference.kind === 'skill'
          ? {kind: 'cards'}
          : reference.kind === 'wheel'
            ? {kind: 'wheel-page', wheelName: reference.name}
            : undefined,
      referenceLayerOverride,
      selectedEnlightenSlot,
    }),
    [],
  )

  const buildSelectedTrailEntry = useCallback(
    (
      reference: DatabaseReferenceInfo,
      referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
    ) => buildTrailEntry(reference, selectedEnlightenSlot, referenceLayerOverride),
    [buildTrailEntry, selectedEnlightenSlot],
  )

  const resolveReferenceByName = useCallback(
    (layer: DatabaseReferenceLayer | null, name: string) =>
      layer ? resolveDatabaseReferenceInfo(layer, name) : null,
    [],
  )

  const resolveReferenceByNameFromCurrentLayer = useCallback(
    (name: string) => resolveReferenceByName(referenceLayer, name),
    [referenceLayer, resolveReferenceByName],
  )

  const buildOverlayFallbackEntry = useCallback(
    (
      overlay: AwakenerOverlayRecord,
      referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
    ): TrailEntry => ({
      key: `overlay:${overlay.id}`,
      referenceId: overlay.id,
      name: overlay.displayName,
      label: buildDatabaseOverlayLabel(overlay),
      description: overlay.descriptionTemplate,
      record: overlay,
      descriptionRank: undefined,
      descriptionMaxRank: undefined,
      referenceLayerOverride,
    }),
    [],
  )

  const buildOverlayEntry = useCallback(
    (
      overlay: AwakenerOverlayRecord,
      referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
    ): TrailEntry => {
      const info = resolveReferenceByName(
        referenceLayerOverride ?? referenceLayer,
        overlay.displayName,
      )
      if (!info) {
        return buildOverlayFallbackEntry(overlay, referenceLayerOverride)
      }
      return buildSelectedTrailEntry(info, referenceLayerOverride)
    },
    [buildOverlayFallbackEntry, buildSelectedTrailEntry, referenceLayer, resolveReferenceByName],
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
      const reference = resolveReferenceByNameFromCurrentLayer(name)
      if (!reference) {
        return
      }
      openRootTrailEntry(buildSelectedTrailEntry(reference), event)
    },
    [buildSelectedTrailEntry, openRootTrailEntry, resolveReferenceByNameFromCurrentLayer],
  )

  const openRootInfo = useCallback(
    (entry: KeyedDatabaseReferenceEntry, event: MouseEvent<HTMLElement>) => {
      openRootTrailEntry(
        {
          ...entry,
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
      setTrail((prev) => {
        const sourceEntry = prev.at(-1)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveReferenceByName(sourceLayer, name)
        if (!reference) {
          return prev
        }
        const entry = buildTrailEntry(
          reference,
          sourceEntry?.selectedEnlightenSlot ?? selectedEnlightenSlot,
          sourceEntry?.referenceLayerOverride ?? null,
        )
        return insertTrailEntryAfterIndex(prev, prev.length - 1, entry)
      })
    },
    [buildTrailEntry, referenceLayer, resolveReferenceByName, selectedEnlightenSlot],
  )

  const openNestedOverlay = useCallback(
    (overlay: AwakenerOverlayRecord) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(-1)
        const entry = buildOverlayEntry(overlay, sourceEntry?.referenceLayerOverride ?? null)
        return insertTrailEntryAfterIndex(prev, prev.length - 1, entry)
      })
    },
    [buildOverlayEntry],
  )

  const openNestedReferenceByNameFrom = useCallback(
    (sourceIndex: number, name: string) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(sourceIndex)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveReferenceByName(sourceLayer, name)
        if (!reference) {
          return prev
        }
        const entry = buildTrailEntry(
          reference,
          sourceEntry?.selectedEnlightenSlot ?? selectedEnlightenSlot,
          sourceEntry?.referenceLayerOverride ?? null,
        )
        return insertTrailEntryAfterIndex(prev, sourceIndex, entry)
      })
    },
    [buildTrailEntry, referenceLayer, resolveReferenceByName, selectedEnlightenSlot],
  )

  const openNestedInfoFrom = useCallback(
    (sourceIndex: number, entry: KeyedDatabaseReferenceEntry) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(sourceIndex)
        return insertTrailEntryAfterIndex(prev, sourceIndex, {
          ...entry,
          referenceLayerOverride:
            entry.referenceLayerOverride ?? sourceEntry?.referenceLayerOverride,
        })
      })
    },
    [],
  )

  const openNestedOverlayFrom = useCallback(
    (sourceIndex: number, overlay: AwakenerOverlayRecord) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(sourceIndex)
        const entry = buildOverlayEntry(overlay, sourceEntry?.referenceLayerOverride ?? null)
        return insertTrailEntryAfterIndex(prev, sourceIndex, entry)
      })
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
      const liveReferenceLayer = entry.referenceLayerOverride ?? referenceLayer
      if (!liveReferenceLayer) {
        return entry
      }
      if (!entry.referenceId) {
        return entry
      }
      const liveReference = resolveDatabaseReferenceInfoById(liveReferenceLayer, entry.referenceId)
      return liveReference
        ? buildSelectedTrailEntry(liveReference, entry.referenceLayerOverride ?? null)
        : entry
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
        const navigationTarget = activeEntry.navigationTarget

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
          onNavigate:
            navigationTarget?.kind === 'cards' && onNavigateToCards
              ? () => {
                  clearTrail()
                  onNavigateToCards()
                }
              : navigationTarget?.kind === 'wheel-page' && onNavigateToWheelPage
                ? () => {
                    clearTrail()
                    onNavigateToWheelPage({name: navigationTarget.wheelName})
                  }
                : undefined,
          onSkillTokenClick: (name: string) => {
            openNestedReferenceByNameFrom(index, name)
          },
          referenceLayer: activeEntry.referenceLayerOverride ?? referenceLayer,
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
      onNavigateToWheelPage,
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
