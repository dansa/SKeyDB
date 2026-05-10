import {useCallback, useEffect, useId, useMemo} from 'react'

import type {AwakenerFull, AwakenerFullStats} from '@/domain/awakeners-full'
import {type Tag} from '@/domain/tags'

import {
  snapshotPopoverAnchor,
  type PopoverAnchorElement,
} from '../RichTextPopovers/core/popover-anchor'
import {usePopoverStore} from '../RichTextPopovers/trail/usePopoverStore'
import {
  buildRichDescriptionScalingTrailEntry,
  buildRichDescriptionSkillTrailEntry,
  buildRichDescriptionTagTrailEntry,
  resolveRichDescriptionCardInfo,
} from './rich-description-entries'

const TRAIL_OPENED_EVENT = 'database:trail-opened'

export function useRichDescriptionTrail(
  fullData: AwakenerFull | null,
  cardNames: Set<string>,
  stats: AwakenerFullStats | null,
  skillLevel: number,
  onNavigateToCards?: () => void,
) {
  const storeTrail = usePopoverStore((state) => state.trail)
  const storeAnchorRect = usePopoverStore((state) => state.anchorRect)
  const storeAnchorElement = usePopoverStore((state) => state.anchorElement)
  const storeOwnerId = usePopoverStore((state) => state.ownerId)

  const clearActiveTrail = usePopoverStore((state) => state.clearActiveTrail)
  const openRoot = usePopoverStore((state) => state.openRoot)
  const pushNested = usePopoverStore((state) => state.pushNested)
  const pop = usePopoverStore((state) => state.pop)
  const closeFrom = usePopoverStore((state) => state.closeFrom)
  const updateRenderContext = usePopoverStore((state) => state.updateRenderContext)

  const ownerId = useId()

  const isOwner = storeOwnerId === ownerId
  const trail = isOwner ? storeTrail : []
  const anchorRect = isOwner ? storeAnchorRect : null
  const anchorElement = isOwner ? storeAnchorElement : null

  useEffect(() => {
    function handleTrailOpened(event: Event) {
      const detail = (event as CustomEvent<{ownerId?: string}>).detail
      if (detail.ownerId === ownerId) {
        return
      }
      clearActiveTrail()
    }

    globalThis.addEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    return () => {
      globalThis.removeEventListener(TRAIL_OPENED_EVENT, handleTrailOpened as EventListener)
    }
  }, [clearActiveTrail, ownerId])

  const announceTrailOpened = useCallback(() => {
    globalThis.dispatchEvent(new CustomEvent(TRAIL_OPENED_EVENT, {detail: {ownerId}}))
  }, [ownerId])

  const handleNavigateToCards = useCallback(
    (targetName?: string) => {
      if (onNavigateToCards) {
        clearActiveTrail()
        onNavigateToCards()

        if (targetName) {
          // Trigger a scroll to the specific skill after a short delay to allow the tab switch to settle
          setTimeout(() => {
            const element = document.querySelector(`[data-skill-name="${targetName}"]`)
            if (element instanceof HTMLElement) {
              element.scrollIntoView({behavior: 'smooth', block: 'center'})

              // Use Web Animations API for a robust and smooth "pleasant" highlight
              element.animate(
                [
                  {
                    backgroundColor: 'rgba(251, 191, 36, 0.25)',
                    outline: '2px solid rgba(251, 191, 36, 0.5)',
                    outlineOffset: '2px',
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.2)',
                  },
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.02)', // Match original bg-white/2
                    outline: '2px solid rgba(251, 191, 36, 0)',
                    outlineOffset: '2px',
                    boxShadow: '0 0 0px rgba(251, 191, 36, 0)',
                  },
                ],
                {
                  duration: 1200,
                  easing: 'cubic-bezier(0, 0, 0.2, 1)', // Smooth ease-out
                },
              )
            }
          }, 200)
        }
      }
    },
    [clearActiveTrail, onNavigateToCards],
  )

  const renderContext = useMemo(
    () => ({
      fullData,
      cardNames,
      stats,
      skillLevel,
      onNavigateToCards: onNavigateToCards ? handleNavigateToCards : undefined,
    }),
    [fullData, cardNames, stats, skillLevel, onNavigateToCards, handleNavigateToCards],
  )

  useEffect(() => {
    updateRenderContext(renderContext, ownerId)
  }, [renderContext, ownerId, updateRenderContext])

  const openSkillTrail = useCallback(
    (name: string, anchorElement: PopoverAnchorElement) => {
      if (!fullData) return
      const result = resolveRichDescriptionCardInfo(fullData, name)
      if (!result) return
      const entry = buildRichDescriptionSkillTrailEntry(result.card, result.label, result.skillType)
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      announceTrailOpened()
      openRoot(entry, anchor.anchorElement, anchor.anchorRect, renderContext, ownerId)
    },
    [announceTrailOpened, fullData, openRoot, renderContext, ownerId],
  )

  const openTagTrail = useCallback(
    (tag: Tag, anchorElement: PopoverAnchorElement) => {
      const entry = buildRichDescriptionTagTrailEntry(tag)
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      announceTrailOpened()
      openRoot(entry, anchor.anchorElement, anchor.anchorRect, renderContext, ownerId)
    },
    [announceTrailOpened, openRoot, renderContext, ownerId],
  )

  const openScalingTrail = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      anchorElement: PopoverAnchorElement,
    ) => {
      const entry = buildRichDescriptionScalingTrailEntry(values, suffix, stat)
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      announceTrailOpened()
      openRoot(entry, anchor.anchorElement, anchor.anchorRect, renderContext, ownerId)
    },
    [announceTrailOpened, openRoot, renderContext, ownerId],
  )

  const openNestedSkillTrail = useCallback(
    (name: string, sourceIndex: number, anchorElement: PopoverAnchorElement) => {
      if (!fullData) return
      const result = resolveRichDescriptionCardInfo(fullData, name)
      if (!result) return
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      const entry = buildRichDescriptionSkillTrailEntry(
        result.card,
        result.label,
        result.skillType,
        anchor.anchorRect,
        anchor.anchorElement,
      )
      pushNested(entry, sourceIndex)
    },
    [fullData, pushNested],
  )

  const openNestedTagTrail = useCallback(
    (tag: Tag, sourceIndex: number, anchorElement: PopoverAnchorElement) => {
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      const entry = buildRichDescriptionTagTrailEntry(tag, anchor.anchorRect, anchor.anchorElement)
      pushNested(entry, sourceIndex)
    },
    [pushNested],
  )

  const openNestedScalingTrail = useCallback(
    (
      values: number[],
      suffix: string,
      stat: string | null,
      sourceIndex: number,
      anchorElement: PopoverAnchorElement,
    ) => {
      const anchor = snapshotPopoverAnchor(anchorElement)
      if (anchor === null) return
      const entry = buildRichDescriptionScalingTrailEntry(
        values,
        suffix,
        stat,
        anchor.anchorRect,
        anchor.anchorElement,
      )
      pushNested(entry, sourceIndex)
    },
    [pushNested],
  )

  return {
    trail,
    trailAnchorRect: anchorRect,
    trailAnchorElement: anchorElement,
    clearTrail: clearActiveTrail,
    openSkillTrail,
    openTagTrail,
    openScalingTrail,
    openNestedSkillTrail,
    openNestedTagTrail,
    openNestedScalingTrail,
    closeTrailTop: pop,
    closeTrailFrom: closeFrom,
  }
}
