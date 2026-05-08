import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'

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
import {hydrateGlobalDatabaseReferenceInfo} from '@/domain/global-database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {
  DatabasePopoverAnchorEvent,
  DatabasePopoverContextValue,
} from './database-popover-context'
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
const LAZY_GLOBAL_REFERENCE_KINDS = new Set(['wheel', 'posse', 'covenant'])

function needsLazyReferenceHydration(reference: DatabaseReferenceInfo): boolean {
  return !reference.description && LAZY_GLOBAL_REFERENCE_KINDS.has(reference.kind)
}

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
          ? {kind: 'skills'}
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

  const hydrateReference = useCallback(
    (reference: DatabaseReferenceInfo) =>
      hydrateGlobalDatabaseReferenceInfo(reference, formulaContext),
    [formulaContext],
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
        const sourceIndex = prev.length - 1
        const sourceKey = sourceEntry?.key
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
        return prev
      })
    },
    [
      buildTrailEntry,
      hydrateReference,
      referenceLayer,
      resolveReferenceByName,
      selectedEnlightenSlot,
    ],
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
        const sourceKey = sourceEntry?.key
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
        return prev
      })
    },
    [
      buildTrailEntry,
      hydrateReference,
      referenceLayer,
      resolveReferenceByName,
      selectedEnlightenSlot,
    ],
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
      if (!liveReference || !entry.description || !liveReference.description) {
        return entry
      }
      return buildSelectedTrailEntry(liveReference, entry.referenceLayerOverride ?? null)
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
      formulaContext,
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
            navigationTarget?.kind === 'skills' && onNavigateToSkills
              ? () => {
                  clearTrail()
                  onNavigateToSkills()
                }
              : navigationTarget?.kind === 'wheel-page' && onNavigateToWheelPage
                ? () => {
                    clearTrail()
                    onNavigateToWheelPage({
                      id: activeEntry.referenceId ?? activeEntry.key,
                      name: navigationTarget.wheelName,
                    })
                  }
                : navigationTarget?.kind === 'covenant-page' && onNavigateToCovenantPage
                  ? () => {
                      clearTrail()
                      onNavigateToCovenantPage({
                        id: activeEntry.referenceId ?? activeEntry.key,
                        name: navigationTarget.covenantName,
                      })
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
      formulaContext,
      onNavigateToSkills,
      onNavigateToWheelPage,
      onNavigateToCovenantPage,
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
