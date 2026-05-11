import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'

import type {AwakenerEnlightenRecord, AwakenerOverlayRecord} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import {hydrateGlobalDatabaseReferenceInfo} from '@/domain/global-database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {
  DatabasePopoverAnchorEvent,
  DatabasePopoverContextValue,
} from './database-popover-context'
import {
  buildOverlayEntry,
  buildTrailEntry,
  needsLazyReferenceHydration,
  resolveLiveTrailEntry,
  resolveNavigationHandler,
  resolveOverlayReference,
  resolveReferenceByName,
  withInheritedReferenceLayerOverride,
} from './database-popover-controller-model'
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
  formulaContext?: PublicFormulaContext
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  stats?: import('@/domain/awakener-source-schema').FullStats | null
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  showVisibleScaling?: boolean
  showTagIcons?: boolean
}

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function useDatabasePopoverController({
  referenceLayer,
  formulaContext,
  selectedEnlightenSlot = null,
  stats = null,
  onNavigateToSkills,
  onNavigateToWheelPage,
  onNavigateToCovenantPage,
  onToggleEnlightenSlot,
  showVisibleScaling = true,
  showTagIcons = true,
}: DatabasePopoverControllerOptions) {
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailAnchorRect, setTrailAnchorRect] = useState<DOMRect | null>(null)
  const [trailAnchorElement, setTrailAnchorElement] = useState<HTMLElement | null>(null)
  const rootHydrationRequestRef = useRef(0)
  const ownerId = useId()

  const invalidateRootHydration = useCallback(() => {
    rootHydrationRequestRef.current += 1
    return rootHydrationRequestRef.current
  }, [])

  const clearTrail = useCallback(() => {
    invalidateRootHydration()
    setTrail([])
    setTrailAnchorRect(null)
    setTrailAnchorElement(null)
  }, [invalidateRootHydration])

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      clearTrail()
    }

    window.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened)
    return () => {
      window.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened)
    }
  }, [clearTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const buildSelectedTrailEntry = useCallback(
    (
      reference: DatabaseReferenceInfo,
      referenceLayerOverride: ResolvedDatabaseReferenceLayer | null = null,
    ) => buildTrailEntry(reference, selectedEnlightenSlot, referenceLayerOverride),
    [selectedEnlightenSlot],
  )

  const hydrateReference = useCallback(
    (reference: DatabaseReferenceInfo) =>
      hydrateGlobalDatabaseReferenceInfo(reference, formulaContext, stats),
    [formulaContext, stats],
  )

  const resolveReferenceByNameFromCurrentLayer = useCallback(
    (name: string) => resolveReferenceByName(referenceLayer, name),
    [referenceLayer],
  )

  const openRootTrailEntry = useCallback(
    (entry: TrailEntry, event: DatabasePopoverAnchorEvent) => {
      event.stopPropagation()
      if (isSameTrailRoot(trail, entry.key)) {
        return
      }
      invalidateRootHydration()
      const anchorElement = event.currentTarget
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(anchorElement.getBoundingClientRect())
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, invalidateRootHydration, trail],
  )

  const openRootTrailEntryAtAnchor = useCallback(
    (entry: TrailEntry, anchorElement: HTMLElement, anchorRect: DOMRect) => {
      if (isSameTrailRoot(trail, entry.key)) {
        return
      }
      invalidateRootHydration()
      announceTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(anchorRect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [announceTrailOpened, invalidateRootHydration, trail],
  )

  const openHydratedRootReferenceAtAnchor = useCallback(
    (reference: DatabaseReferenceInfo, anchorElement: HTMLElement, anchorRect: DOMRect) => {
      const hydrationRequest = invalidateRootHydration()
      void hydrateReference(reference).then((hydratedReference) => {
        if (hydrationRequest !== rootHydrationRequestRef.current) {
          return
        }
        openRootTrailEntryAtAnchor(
          buildSelectedTrailEntry(hydratedReference),
          anchorElement,
          anchorRect,
        )
      })
    },
    [
      buildSelectedTrailEntry,
      hydrateReference,
      invalidateRootHydration,
      openRootTrailEntryAtAnchor,
    ],
  )

  const queueHydratedNestedReference = useCallback(
    (sourceIndex: number, sourceKey: string | undefined, reference: DatabaseReferenceInfo) => {
      void hydrateReference(reference).then((hydratedReference) => {
        setTrail((current) => {
          const currentSourceEntry = current.at(sourceIndex)
          if (!sourceKey || currentSourceEntry?.key !== sourceKey) {
            return current
          }
          const entry = buildTrailEntry(
            hydratedReference,
            currentSourceEntry.selectedEnlightenSlot ?? selectedEnlightenSlot,
            currentSourceEntry.referenceLayerOverride ?? null,
          )
          return insertTrailEntryAfterIndex(current, sourceIndex, entry)
        })
      })
    },
    [hydrateReference, selectedEnlightenSlot],
  )

  const openRootReferenceByName = useCallback(
    (name: string, event: DatabasePopoverAnchorEvent) => {
      event.stopPropagation()
      const reference = resolveReferenceByNameFromCurrentLayer(name)
      if (!reference) {
        return
      }
      if (!needsLazyReferenceHydration(reference)) {
        openRootTrailEntryAtAnchor(
          buildSelectedTrailEntry(reference),
          event.currentTarget,
          event.currentTarget.getBoundingClientRect(),
        )
        return
      }
      const anchorElement = event.currentTarget
      const anchorRect = anchorElement.getBoundingClientRect()
      openHydratedRootReferenceAtAnchor(reference, anchorElement, anchorRect)
    },
    [
      buildSelectedTrailEntry,
      openHydratedRootReferenceAtAnchor,
      openRootTrailEntryAtAnchor,
      resolveReferenceByNameFromCurrentLayer,
    ],
  )

  const openRootInfo = useCallback(
    (entry: KeyedDatabaseReferenceEntry, event: DatabasePopoverAnchorEvent) => {
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
    (overlay: AwakenerOverlayRecord, event: DatabasePopoverAnchorEvent) => {
      event.stopPropagation()
      const entry = buildOverlayEntry({overlay, referenceLayer, selectedEnlightenSlot})
      const reference = resolveOverlayReference(referenceLayer, overlay)
      if (!reference || !needsLazyReferenceHydration(reference)) {
        openRootTrailEntry(entry, event)
        return
      }

      const anchorElement = event.currentTarget
      const anchorRect = anchorElement.getBoundingClientRect()
      openHydratedRootReferenceAtAnchor(reference, anchorElement, anchorRect)
    },
    [openHydratedRootReferenceAtAnchor, openRootTrailEntry, referenceLayer, selectedEnlightenSlot],
  )

  const openNestedReferenceByName = useCallback(
    (name: string) => {
      setTrail((prev) => {
        const sourceIndex = prev.length - 1
        const sourceEntry = prev.at(sourceIndex)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveReferenceByName(sourceLayer, name)
        if (!reference) {
          return prev
        }
        queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference)
        return prev
      })
    },
    [queueHydratedNestedReference, referenceLayer],
  )

  const openNestedOverlay = useCallback(
    (overlay: AwakenerOverlayRecord) => {
      setTrail((prev) => {
        const sourceIndex = prev.length - 1
        const sourceEntry = prev.at(sourceIndex)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveOverlayReference(sourceLayer, overlay)
        if (reference && needsLazyReferenceHydration(reference)) {
          queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference)
          return prev
        }
        const entry = buildOverlayEntry({
          overlay,
          referenceLayer,
          referenceLayerOverride: sourceEntry?.referenceLayerOverride ?? null,
          selectedEnlightenSlot,
        })
        return insertTrailEntryAfterIndex(prev, sourceIndex, entry)
      })
    },
    [queueHydratedNestedReference, referenceLayer, selectedEnlightenSlot],
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
        queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference)
        return prev
      })
    },
    [queueHydratedNestedReference, referenceLayer],
  )

  const openNestedInfoFrom = useCallback(
    (sourceIndex: number, entry: KeyedDatabaseReferenceEntry) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(sourceIndex)
        return insertTrailEntryAfterIndex(
          prev,
          sourceIndex,
          withInheritedReferenceLayerOverride(entry, sourceEntry),
        )
      })
    },
    [],
  )

  const openNestedOverlayFrom = useCallback(
    (sourceIndex: number, overlay: AwakenerOverlayRecord) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(sourceIndex)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveOverlayReference(sourceLayer, overlay)
        if (reference && needsLazyReferenceHydration(reference)) {
          queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference)
          return prev
        }
        const entry = buildOverlayEntry({
          overlay,
          referenceLayer,
          referenceLayerOverride: sourceEntry?.referenceLayerOverride ?? null,
          selectedEnlightenSlot,
        })
        return insertTrailEntryAfterIndex(prev, sourceIndex, entry)
      })
    },
    [queueHydratedNestedReference, referenceLayer, selectedEnlightenSlot],
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
      formulaContext,
      stats,
      entries: trail.map((entry, index) => {
        const activeEntry = resolveLiveTrailEntry({
          entry,
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
          onNavigate,
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
      formulaContext,
      onNavigateToSkills,
      onNavigateToWheelPage,
      onNavigateToCovenantPage,
      onToggleEnlightenSlot,
      openNestedInfoFrom,
      openNestedOverlayFrom,
      openNestedReferenceByNameFrom,
      referenceLayer,
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
