import React, {useRef, type ReactNode} from 'react'

import {DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent} from '@dnd-kit/core'
import {createPortal} from 'react-dom'

import {decideTrailDirection, isTrailMobileLayout} from '@/pages/database/utils/popover-trail'

import {POPOVER_LAYOUT} from '../core/popover-config'
import {usePopoverTrailDismiss, usePopoverTrailViewportVersion} from './popover-trail-panel-hooks'
import {DesktopPopoverTrailPanel, MobilePopoverTrailPanel} from './PopoverTrailPanelLayouts'
import {usePopoverStore} from './usePopoverStore'

type PopoverTrailPanelProps = Readonly<{
  anchorRect: DOMRect
  anchorElement?: HTMLElement | null
  trailRects?: (DOMRect | undefined)[]
  itemCount: number
  floatingCount?: number
  onCloseTop: () => void
  children: ReactNode
}>

export function PopoverTrailPanel({
  anchorRect,
  anchorElement,
  trailRects,
  itemCount,
  floatingCount = 0,
  onCloseTop,
  children,
}: PopoverTrailPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const updateOffset = usePopoverStore((state) => state.updateOffset)
  const trail = usePopoverStore((state) => state.trail)
  const floating = usePopoverStore((state) => state.floating)
  const isFromFloating = usePopoverStore((state) => state.isFromFloating)

  const viewportVersion = usePopoverTrailViewportVersion()
  usePopoverTrailDismiss(containerRef, onCloseTop)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    }),
  )

  const isMobile = isTrailMobileLayout(globalThis.innerWidth)

  const currentAnchorRect = React.useMemo(() => {
    // Explicitly reference viewportVersion to trigger re-calculation on scroll/resize
    void viewportVersion
    return !isFromFloating && anchorElement?.isConnected
      ? anchorElement.getBoundingClientRect()
      : anchorRect
  }, [isFromFloating, anchorElement, anchorRect, viewportVersion])

  const direction = React.useMemo(() => {
    return isMobile ? 'down' : decideTrailDirection(currentAnchorRect, globalThis.innerHeight)
  }, [isMobile, currentAnchorRect])

  const handleDragEnd = (event: DragEndEvent) => {
    const {active, delta} = event
    const key = active.id as string
    const state = usePopoverStore.getState()
    const currentOffset = state.offsets[key] ?? {x: 0, y: 0}

    const floatingIndex = state.floating.findIndex((t) => t.key === key)
    const trailIndex = state.trail.findIndex((t) => t.key === key)

    if (floatingIndex === -1 && trailIndex === -1) {
      updateOffset(key, currentOffset.x + delta.x, currentOffset.y + delta.y)
      return
    }

    const isFloating = floatingIndex !== -1
    const entry = isFloating ? state.floating[floatingIndex] : state.trail[trailIndex]

    const rect = isFloating
      ? (entry.rect ?? currentAnchorRect)
      : trailIndex === 0
        ? currentAnchorRect
        : (entry.rect ?? currentAnchorRect)

    const entryDirection = entry.direction ?? direction

    const vw = globalThis.innerWidth
    const vh = globalThis.innerHeight
    const gap = POPOVER_LAYOUT.GAP

    const popoverRect = active.rect.current.translated
    if (!popoverRect) {
      updateOffset(key, currentOffset.x + delta.x, currentOffset.y + delta.y)
      return
    }

    let layoutLeft = rect.left
    if (layoutLeft + popoverRect.width > vw) {
      layoutLeft = vw - popoverRect.width
    }
    if (layoutLeft < 0) {
      layoutLeft = 0
    }

    const isNested = trailIndex > 0 || isFloating
    const verticalGap = isNested ? 2 : gap

    let layoutTop =
      entryDirection === 'up'
        ? rect.top - verticalGap - popoverRect.height
        : rect.bottom + verticalGap
    if (layoutTop + popoverRect.height > vh) {
      layoutTop = vh - popoverRect.height
    }
    if (layoutTop < 0) {
      layoutTop = 0
    }

    layoutLeft = Math.round(layoutLeft)
    layoutTop = Math.round(layoutTop)

    const desiredLeft = layoutLeft + currentOffset.x + delta.x
    const desiredTop = layoutTop + currentOffset.y + delta.y

    const hLimit = 40
    const finalLeft = Math.max(0, Math.min(vw - popoverRect.width, desiredLeft))
    const finalTop = Math.max(0, Math.min(vh - hLimit, desiredTop))

    const newOffsetX = Math.round(finalLeft - layoutLeft)
    const newOffsetY = Math.round(finalTop - layoutTop)

    updateOffset(key, newOffsetX, newOffsetY)
  }

  const childArray = React.Children.toArray(children)

  const content = isMobile ? (
    <MobilePopoverTrailPanel
      children={childArray}
      containerRef={containerRef}
      itemCount={itemCount + floatingCount}
      onCloseTop={onCloseTop}
    />
  ) : (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <DesktopPopoverTrailPanel
        children={childArray}
        containerRef={containerRef}
        currentAnchorRect={currentAnchorRect}
        direction={direction}
        floating={floating}
        trail={trail}
        trailRects={trailRects}
      />
    </DndContext>
  )

  return createPortal(content, document.body)
}
