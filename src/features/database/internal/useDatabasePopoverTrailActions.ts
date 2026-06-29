import {useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction} from 'react'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import type {
  DatabaseReferenceInfo,
  ResolvedDatabaseReferenceLayer,
} from '@/domain/database-reference-layer'
import {hydrateGlobalDatabaseReferenceInfo} from '@/domain/global-database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {
  DatabasePopoverAnchorEvent,
  DatabasePopoverContextValue,
  DatabasePopoverDescriptionRankContext,
} from './database-popover-context'
import {
  buildOverlayEntry,
  buildTrailEntry,
  needsLazyReferenceHydration,
  resolveLiveTrailEntry,
  resolveNavigationHandler,
  resolveOverlayReference,
  resolveReferenceByName,
  withDescriptionRankContext,
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

type TrailSetter = Dispatch<SetStateAction<TrailEntry[]>>
interface RootHydrationRequestRef {
  current: number
}

interface DatabasePopoverTrailActionsOptions {
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  formulaContext?: PublicFormulaContext
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  currentDescriptionRankContext?: DatabasePopoverDescriptionRankContext
  stats: FullStats | null
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  showVisibleScaling: boolean
  showTagIcons: boolean
  onRootTrailOpened: () => void
}

export function useDatabasePopoverTrailActions({
  referenceLayer,
  formulaContext,
  selectedEnlightenSlot,
  currentDescriptionRankContext,
  stats,
  onNavigateToSkills,
  onNavigateToWheelPage,
  onNavigateToCovenantPage,
  onToggleEnlightenSlot,
  showVisibleScaling,
  showTagIcons,
  onRootTrailOpened,
}: DatabasePopoverTrailActionsOptions) {
  const [trail, setTrail] = useState<TrailEntry[]>([])
  const [trailAnchorRect, setTrailAnchorRect] = useState<DOMRect | null>(null)
  const [trailAnchorElement, setTrailAnchorElement] = useState<HTMLElement | null>(null)
  const rootHydrationRequestRef = useRef(0)

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

  const rootActions = useDatabasePopoverRootActions({
    buildSelectedTrailEntry,
    hydrateReference,
    invalidateRootHydration,
    onRootTrailOpened,
    referenceLayer,
    rootHydrationRequestRef,
    selectedEnlightenSlot,
    setTrail,
    setTrailAnchorElement,
    setTrailAnchorRect,
    trail,
  })
  const nestedActions = useDatabasePopoverNestedActions({
    hydrateReference,
    referenceLayer,
    selectedEnlightenSlot,
    setTrail,
  })

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
      openRootInfo: rootActions.openRootInfo,
      openRootReferenceByName: rootActions.openRootReferenceByName,
      openRootOverlay: rootActions.openRootOverlay,
      openNestedReferenceByName: nestedActions.openNestedReferenceByName,
      openNestedOverlay: nestedActions.openNestedOverlay,
      hasOpenPopovers: trail.length > 0,
      closeAllPopovers: clearTrail,
    }),
    [clearTrail, nestedActions, rootActions, trail.length],
  )

  const popoverRootProps = useDatabasePopoverRootProps({
    clearTrail,
    closeTrailFrom,
    formulaContext,
    nestedActions,
    onNavigateToCovenantPage,
    onNavigateToSkills,
    onNavigateToWheelPage,
    onToggleEnlightenSlot,
    referenceLayer,
    selectedEnlightenSlot,
    currentDescriptionRankContext,
    showTagIcons,
    showVisibleScaling,
    stats,
    trail,
    trailAnchorElement,
    trailAnchorRect,
  })

  return {
    contextValue,
    hasOpenPopovers: trail.length > 0,
    closeAllPopovers: clearTrail,
    popoverRootProps,
  }
}

interface RootActionOptions {
  buildSelectedTrailEntry: (
    reference: DatabaseReferenceInfo,
    referenceLayerOverride?: ResolvedDatabaseReferenceLayer | null,
  ) => TrailEntry
  hydrateReference: (reference: DatabaseReferenceInfo) => Promise<DatabaseReferenceInfo>
  invalidateRootHydration: () => number
  onRootTrailOpened: () => void
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  rootHydrationRequestRef: RootHydrationRequestRef
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  setTrail: TrailSetter
  setTrailAnchorElement: (element: HTMLElement | null) => void
  setTrailAnchorRect: (rect: DOMRect | null) => void
  trail: TrailEntry[]
}

function useDatabasePopoverRootActions({
  buildSelectedTrailEntry,
  hydrateReference,
  invalidateRootHydration,
  onRootTrailOpened,
  referenceLayer,
  rootHydrationRequestRef,
  selectedEnlightenSlot,
  setTrail,
  setTrailAnchorElement,
  setTrailAnchorRect,
  trail,
}: RootActionOptions) {
  const openRootTrailEntry = useCallback(
    (entry: TrailEntry, event: DatabasePopoverAnchorEvent) => {
      event.stopPropagation()
      if (isSameTrailRoot(trail, entry.key)) {
        return
      }
      invalidateRootHydration()
      const anchorElement = event.currentTarget
      onRootTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(anchorElement.getBoundingClientRect())
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [
      invalidateRootHydration,
      onRootTrailOpened,
      setTrail,
      setTrailAnchorElement,
      setTrailAnchorRect,
      trail,
    ],
  )

  const openRootTrailEntryAtAnchor = useCallback(
    (entry: TrailEntry, anchorElement: HTMLElement, anchorRect: DOMRect) => {
      if (isSameTrailRoot(trail, entry.key)) {
        return
      }
      invalidateRootHydration()
      onRootTrailOpened()
      setTrailAnchorElement(anchorElement)
      setTrailAnchorRect(anchorRect)
      setTrail((prev) => openTrailRoot(prev, entry))
    },
    [
      invalidateRootHydration,
      onRootTrailOpened,
      setTrail,
      setTrailAnchorElement,
      setTrailAnchorRect,
      trail,
    ],
  )

  const openHydratedRootReferenceAtAnchor = useCallback(
    (
      reference: DatabaseReferenceInfo,
      anchorElement: HTMLElement,
      anchorRect: DOMRect,
      rankContext?: DatabasePopoverDescriptionRankContext,
    ) => {
      const hydrationRequest = invalidateRootHydration()
      void hydrateReference(reference).then((hydratedReference) => {
        if (hydrationRequest !== rootHydrationRequestRef.current) {
          return
        }
        openRootTrailEntryAtAnchor(
          withDescriptionRankContext(buildSelectedTrailEntry(hydratedReference), rankContext),
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
      rootHydrationRequestRef,
    ],
  )

  const openRootReferenceAtAnchor = useCallback(
    (reference: DatabaseReferenceInfo, anchorElement: HTMLElement, anchorRect: DOMRect) => {
      if (needsLazyReferenceHydration(reference)) {
        openHydratedRootReferenceAtAnchor(reference, anchorElement, anchorRect)
        return
      }
      openRootTrailEntryAtAnchor(buildSelectedTrailEntry(reference), anchorElement, anchorRect)
    },
    [buildSelectedTrailEntry, openHydratedRootReferenceAtAnchor, openRootTrailEntryAtAnchor],
  )

  const openRootReferenceByName = useCallback(
    (
      name: string,
      event: DatabasePopoverAnchorEvent,
      preferredKind?: DatabaseReferenceInfo['kind'],
    ) => {
      event.stopPropagation()
      const reference = resolveReferenceByName(referenceLayer, name, preferredKind)
      if (!reference) {
        return
      }
      const anchorElement = event.currentTarget
      openRootReferenceAtAnchor(reference, anchorElement, anchorElement.getBoundingClientRect())
    },
    [openRootReferenceAtAnchor, referenceLayer],
  )

  const openRootInfo = useCallback(
    (entry: KeyedDatabaseReferenceEntry, event: DatabasePopoverAnchorEvent) => {
      openRootTrailEntry({...entry}, event)
    },
    [openRootTrailEntry],
  )

  const openRootOverlay = useCallback(
    (
      overlay: AwakenerOverlayRecord,
      event: DatabasePopoverAnchorEvent,
      rankContext?: DatabasePopoverDescriptionRankContext,
    ) => {
      event.stopPropagation()
      const entry = buildOverlayEntry({overlay, rankContext, referenceLayer, selectedEnlightenSlot})
      const reference = resolveOverlayReference(referenceLayer, overlay)
      if (!reference || !needsLazyReferenceHydration(reference)) {
        openRootTrailEntry(entry, event)
        return
      }

      const anchorElement = event.currentTarget
      openHydratedRootReferenceAtAnchor(
        reference,
        anchorElement,
        anchorElement.getBoundingClientRect(),
        rankContext,
      )
    },
    [openHydratedRootReferenceAtAnchor, openRootTrailEntry, referenceLayer, selectedEnlightenSlot],
  )

  return useMemo(
    () => ({
      openRootInfo,
      openRootOverlay,
      openRootReferenceByName,
    }),
    [openRootInfo, openRootOverlay, openRootReferenceByName],
  )
}

interface NestedActionOptions {
  hydrateReference: (reference: DatabaseReferenceInfo) => Promise<DatabaseReferenceInfo>
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  setTrail: TrailSetter
}

function useDatabasePopoverNestedActions({
  hydrateReference,
  referenceLayer,
  selectedEnlightenSlot,
  setTrail,
}: NestedActionOptions) {
  const queueHydratedNestedReference = useCallback(
    (
      sourceIndex: number,
      sourceKey: string | undefined,
      reference: DatabaseReferenceInfo,
      rankContext?: DatabasePopoverDescriptionRankContext,
    ) => {
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
          return insertTrailEntryAfterIndex(
            current,
            sourceIndex,
            withDescriptionRankContext(entry, rankContext),
          )
        })
      })
    },
    [hydrateReference, selectedEnlightenSlot, setTrail],
  )

  const openNestedReferenceByNameFrom = useCallback(
    (sourceIndex: number, name: string, preferredKind?: DatabaseReferenceInfo['kind']) => {
      setTrail((prev) => {
        const sourceEntry = prev.at(sourceIndex)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveReferenceByName(sourceLayer, name, preferredKind)
        if (!reference) {
          return prev
        }
        queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference)
        return prev
      })
    },
    [queueHydratedNestedReference, referenceLayer, setTrail],
  )

  const openNestedReferenceByName = useCallback(
    (name: string, preferredKind?: DatabaseReferenceInfo['kind']) => {
      setTrail((prev) => {
        const sourceIndex = prev.length - 1
        const sourceEntry = prev.at(sourceIndex)
        const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
        const reference = resolveReferenceByName(sourceLayer, name, preferredKind)
        if (!reference) {
          return prev
        }
        queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference)
        return prev
      })
    },
    [queueHydratedNestedReference, referenceLayer, setTrail],
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
    [setTrail],
  )

  const openNestedOverlayFrom = useCallback(
    (
      sourceIndex: number,
      overlay: AwakenerOverlayRecord,
      rankContext?: DatabasePopoverDescriptionRankContext,
    ) => {
      setTrail((prev) =>
        openNestedOverlayFromTrail({
          overlay,
          prev,
          queueHydratedNestedReference,
          rankContext,
          referenceLayer,
          selectedEnlightenSlot,
          sourceIndex,
        }),
      )
    },
    [queueHydratedNestedReference, referenceLayer, selectedEnlightenSlot, setTrail],
  )

  const openNestedOverlay = useCallback(
    (overlay: AwakenerOverlayRecord, rankContext?: DatabasePopoverDescriptionRankContext) => {
      setTrail((prev) =>
        openNestedOverlayFromTrail({
          overlay,
          prev,
          queueHydratedNestedReference,
          rankContext,
          referenceLayer,
          selectedEnlightenSlot,
          sourceIndex: prev.length - 1,
        }),
      )
    },
    [queueHydratedNestedReference, referenceLayer, selectedEnlightenSlot, setTrail],
  )

  return useMemo(
    () => ({
      openNestedInfoFrom,
      openNestedOverlay,
      openNestedOverlayFrom,
      openNestedReferenceByName,
      openNestedReferenceByNameFrom,
    }),
    [
      openNestedInfoFrom,
      openNestedOverlay,
      openNestedOverlayFrom,
      openNestedReferenceByName,
      openNestedReferenceByNameFrom,
    ],
  )
}

function openNestedOverlayFromTrail({
  overlay,
  prev,
  queueHydratedNestedReference,
  rankContext,
  referenceLayer,
  selectedEnlightenSlot,
  sourceIndex,
}: {
  overlay: AwakenerOverlayRecord
  prev: TrailEntry[]
  queueHydratedNestedReference: (
    sourceIndex: number,
    sourceKey: string | undefined,
    reference: DatabaseReferenceInfo,
    rankContext?: DatabasePopoverDescriptionRankContext,
  ) => void
  rankContext?: DatabasePopoverDescriptionRankContext
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  sourceIndex: number
}): TrailEntry[] {
  const sourceEntry = prev.at(sourceIndex)
  const sourceLayer = sourceEntry?.referenceLayerOverride ?? referenceLayer
  const reference = resolveOverlayReference(sourceLayer, overlay)
  if (reference && needsLazyReferenceHydration(reference)) {
    queueHydratedNestedReference(sourceIndex, sourceEntry?.key, reference, rankContext)
    return prev
  }
  const entry = buildOverlayEntry({
    overlay,
    rankContext,
    referenceLayer,
    referenceLayerOverride: sourceEntry?.referenceLayerOverride ?? null,
    selectedEnlightenSlot,
  })
  return insertTrailEntryAfterIndex(prev, sourceIndex, entry)
}

interface RootPropsOptions {
  clearTrail: () => void
  closeTrailFrom: (index: number) => void
  formulaContext?: PublicFormulaContext
  nestedActions: ReturnType<typeof useDatabasePopoverNestedActions>
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  currentDescriptionRankContext?: DatabasePopoverDescriptionRankContext
  showTagIcons: boolean
  showVisibleScaling: boolean
  stats: FullStats | null
  trail: TrailEntry[]
  trailAnchorElement: HTMLElement | null
  trailAnchorRect: DOMRect | null
}

function useDatabasePopoverRootProps({
  clearTrail,
  closeTrailFrom,
  formulaContext,
  nestedActions,
  onNavigateToSkills,
  onNavigateToWheelPage,
  onNavigateToCovenantPage,
  onToggleEnlightenSlot,
  referenceLayer,
  selectedEnlightenSlot,
  currentDescriptionRankContext,
  showTagIcons,
  showVisibleScaling,
  stats,
  trail,
  trailAnchorElement,
  trailAnchorRect,
}: RootPropsOptions): DatabasePopoverRootProps {
  return useMemo<DatabasePopoverRootProps>(
    () => ({
      anchorElement: trailAnchorElement,
      anchorRect: trailAnchorRect,
      referenceLayer,
      formulaContext,
      stats,
      entries: trail.map((entry, index) =>
        buildPopoverPortalEntry({
          clearTrail,
          closeTrailFrom,
          entry,
          index,
          nestedActions,
          onNavigateToCovenantPage,
          onNavigateToSkills,
          onNavigateToWheelPage,
          referenceLayer,
          selectedEnlightenSlot,
          currentDescriptionRankContext,
        }),
      ),
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
      nestedActions,
      onNavigateToSkills,
      onNavigateToWheelPage,
      onNavigateToCovenantPage,
      onToggleEnlightenSlot,
      referenceLayer,
      selectedEnlightenSlot,
      currentDescriptionRankContext,
      showTagIcons,
      showVisibleScaling,
      stats,
      trail,
      trailAnchorElement,
      trailAnchorRect,
    ],
  )
}

function buildPopoverPortalEntry({
  clearTrail,
  closeTrailFrom,
  entry,
  index,
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
  nestedActions: ReturnType<typeof useDatabasePopoverNestedActions>
  onNavigateToSkills?: () => void
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null
  currentDescriptionRankContext?: DatabasePopoverDescriptionRankContext
}): DatabasePopoverRootProps['entries'][number] {
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
    layerIndex: index,
    onClose: () => {
      closeTrailFrom(index)
    },
    onInfoEntryClick: (nextEntry: KeyedDatabaseReferenceEntry) => {
      nestedActions.openNestedInfoFrom(index, nextEntry)
    },
    onMechanicTokenClick: (
      overlay: AwakenerOverlayRecord,
      rankContext?: DatabasePopoverDescriptionRankContext,
    ) => {
      nestedActions.openNestedOverlayFrom(index, overlay, rankContext)
    },
    onNavigate,
    onSkillTokenClick: (name: string, referenceKind?: DatabaseReferenceInfo['kind']) => {
      nestedActions.openNestedReferenceByNameFrom(index, name, referenceKind)
    },
    referenceLayer: activeEntry.referenceLayerOverride ?? referenceLayer,
  }
}
