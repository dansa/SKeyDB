import {useCallback, useContext, useEffect, useId, useMemo} from 'react'

import type {
  AwakenerEnlightenRecord,
  AwakenerOverlayRecord,
  FullStats,
} from '@/domain/awakener-source-schema'
import type {ResolvedDatabaseReferenceLayer} from '@/domain/database-reference-layer'
import type {PublicFormulaContext} from '@/domain/public-formula-context'

import type {KeyedDatabaseReferenceEntry} from './database-reference-entry'
import {
  PopoverStoreContext,
  usePopoverActions,
  usePopoverStore,
  type DatabasePopoverAnchorEvent,
  type DatabasePopoverDescriptionRankContext,
} from './usePopoverStore'

/**
 * Configuration options for the database popover controller.
 */
interface DatabasePopoverControllerOptions {
  /** Resolved database reference info layer. */
  referenceLayer: ResolvedDatabaseReferenceLayer | null
  /** Global public formula context values. */
  formulaContext?: PublicFormulaContext
  /** Active enlighten slot configuration. */
  selectedEnlightenSlot?: AwakenerEnlightenRecord['slot'] | null
  /** Current active progression rank context. */
  currentDescriptionRankContext?: DatabasePopoverDescriptionRankContext
  /** Stat parameters and modifications. */
  stats?: FullStats | null
  /** Callback triggered when navigating to full skill list. */
  onNavigateToSkills?: () => void
  /** Callback triggered when navigating to a wheel details page. */
  onNavigateToWheelPage?: (wheel: {id: string; name: string}) => void
  /** Callback triggered when navigating to a covenant details page. */
  onNavigateToCovenantPage?: (covenant: {id: string; name: string}) => void
  /** Callback triggered when slot settings are toggled. */
  onToggleEnlightenSlot?: (slot: AwakenerEnlightenRecord['slot']) => void
  /** Visibility toggle for scaling math breakdowns. */
  showVisibleScaling?: boolean
  /** Visibility toggle for tag icons. */
  showTagIcons?: boolean
}

const TRAIL_OPENED_EVENT = 'database:trail-opened'

/**
 * Controller hook responsible for managing popover trails, coordinate tracking,
 * page navigation hooks, and lazy data preloads from popover actions.
 */
export function useDatabasePopoverController({
  referenceLayer,
  formulaContext,
  selectedEnlightenSlot = null,
  currentDescriptionRankContext,
  stats = null,
  onNavigateToSkills,
  onNavigateToWheelPage,
  onNavigateToCovenantPage,
  onToggleEnlightenSlot,
  showVisibleScaling = true,
  showTagIcons = true,
}: DatabasePopoverControllerOptions) {
  const ownerId = useId()
  const announceTrailOpened = useCallback(() => {
    window.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const storeApi = useContext(PopoverStoreContext)

  const trailLength = usePopoverStore((state) => state.trail.length)
  const floatingLength = usePopoverStore((state) => state.floating.length)
  const anchorElement = usePopoverStore((state) => state.anchorElement)
  const anchorRect = usePopoverStore((state) => state.anchorRect)

  const {
    openRootInfo,
    openRootReferenceByName,
    openRootOverlay,
    openNestedReferenceByName,
    openNestedOverlay,
    openNestedInfoFrom,
    openNestedOverlayFrom,
    openNestedReferenceByNameFrom,
    clearTrail,
    closeFrom,
  } = usePopoverActions()

  useEffect(() => {
    if (!storeApi) {
      return
    }
    storeApi.getState().setDatabaseContext({
      ownerId,
      referenceLayer,
      formulaContext: formulaContext ?? null,
      stats,
      selectedEnlightenSlot,
      currentDescriptionRankContext: currentDescriptionRankContext ?? null,
      showTagIcons,
      showVisibleScaling,
    })
  }, [
    storeApi,
    ownerId,
    referenceLayer,
    formulaContext,
    stats,
    selectedEnlightenSlot,
    currentDescriptionRankContext,
    showTagIcons,
    showVisibleScaling,
  ])

  const dismissTrailKeepingPinned = useCallback(() => {
    if (storeApi?.getState().ownerId === ownerId) {
      clearTrail()
    }
  }, [ownerId, storeApi, clearTrail])

  const closeTrailFrom = useCallback(
    (index: number) => {
      closeFrom(index)
    },
    [closeFrom],
  )

  const handleOpenRootInfo = useCallback(
    (entry: KeyedDatabaseReferenceEntry, event: DatabasePopoverAnchorEvent) => {
      openRootInfo(entry, event, ownerId)
      announceTrailOpened()
    },
    [openRootInfo, ownerId, announceTrailOpened],
  )

  const handleOpenRootReferenceByName = useCallback(
    (name: string, event: DatabasePopoverAnchorEvent) => {
      openRootReferenceByName(name, event, ownerId)
      announceTrailOpened()
    },
    [openRootReferenceByName, ownerId, announceTrailOpened],
  )

  const handleOpenRootOverlay = useCallback(
    (
      overlay: AwakenerOverlayRecord,
      event: DatabasePopoverAnchorEvent,
      rankContext?: DatabasePopoverDescriptionRankContext,
    ) => {
      openRootOverlay(overlay, event, rankContext, ownerId)
      announceTrailOpened()
    },
    [openRootOverlay, ownerId, announceTrailOpened],
  )

  const contextValue = useMemo(
    () => ({
      openRootInfo: handleOpenRootInfo,
      openRootReferenceByName: handleOpenRootReferenceByName,
      openRootOverlay: handleOpenRootOverlay,
      openNestedReferenceByName,
      openNestedOverlay,
      hasOpenPopovers: trailLength > 0 || floatingLength > 0,
      closeAllPopovers: dismissTrailKeepingPinned,
      showTagIcons,
      showVisibleScaling,
    }),
    [
      handleOpenRootInfo,
      handleOpenRootReferenceByName,
      handleOpenRootOverlay,
      openNestedReferenceByName,
      openNestedOverlay,
      trailLength,
      floatingLength,
      dismissTrailKeepingPinned,
      showTagIcons,
      showVisibleScaling,
    ],
  )

  const nestedActions = useMemo(
    () => ({
      openNestedInfoFrom,
      openNestedOverlayFrom,
      openNestedReferenceByNameFrom,
    }),
    [openNestedInfoFrom, openNestedOverlayFrom, openNestedReferenceByNameFrom],
  )

  const popoverRootProps = useMemo(
    () => ({
      anchorElement,
      anchorRect,
      referenceLayer,
      formulaContext,
      stats,
      closeOnOutsideClick: false,
      onToggleEnlightenSlot,
      selectedEnlightenSlot,
      currentDescriptionRankContext,
      showTagIcons,
      showVisibleScaling,
      onNavigateToSkills,
      onNavigateToWheelPage,
      onNavigateToCovenantPage,
      nestedActions,
      onCloseAll: dismissTrailKeepingPinned,
      closeTrailFrom,
    }),
    [
      anchorElement,
      anchorRect,
      referenceLayer,
      formulaContext,
      stats,
      onToggleEnlightenSlot,
      selectedEnlightenSlot,
      currentDescriptionRankContext,
      showTagIcons,
      showVisibleScaling,
      onNavigateToSkills,
      onNavigateToWheelPage,
      onNavigateToCovenantPage,
      nestedActions,
      dismissTrailKeepingPinned,
      closeTrailFrom,
    ],
  )

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      dismissTrailKeepingPinned()
    }
    window.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened)
    return () => {
      window.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened)
    }
  }, [dismissTrailKeepingPinned, ownerId])

  useEffect(() => {
    return () => {
      if (storeApi?.getState().ownerId === ownerId) {
        storeApi.getState().clearTrailOnly()
      }
    }
  }, [ownerId, storeApi])

  const closeTopPopover = useCallback(() => {
    if (storeApi?.getState().ownerId !== ownerId) {
      return
    }

    const totalCount = trailLength + floatingLength
    if (totalCount > 0) {
      closeFrom(totalCount - 1)
    }
  }, [ownerId, storeApi, trailLength, floatingLength, closeFrom])

  return {
    ownerId,
    contextValue,
    hasOpenPopovers: trailLength > 0 || floatingLength > 0,
    closeAllPopovers: dismissTrailKeepingPinned,
    dismissTrailKeepingPinned,
    closeTopPopover,
    popoverRootProps,
  }
}
