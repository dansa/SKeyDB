import {useEffect, useLayoutEffect, useState, type RefObject} from 'react'

import {POPOVER_LAYOUT} from '../core/popover-config'
import {calculateBasePosition} from './popover-layout-math'
import type {TrailEntry} from './popover-trail'

/**
 * Interface options configuring popover boundary calculations and size tracking.
 */
interface UsePopoverGeometryOptions {
  /** The unique key ID identifying the popover. */
  id: string
  /** Bounding box rectangle of the trigger anchor element. */
  anchorRect: DOMRect
  /** Preferred visual overflow direction: 'up' or 'down'. */
  direction: 'up' | 'down'
  /** Stack z-index position depth. */
  zIndex: number
  /** Callback fired immediately after new layouts have been resolved and aligned. */
  onPosition: () => void
  /** Ref to the popover outer shell container. */
  ref: RefObject<HTMLDivElement | null>
  /** Whether the user is actively dragging this popover. */
  isDragging: boolean
  /** Whether this popover has been pinned by the user. */
  isPinned: boolean
  /** Corresponding popover trail entry state metadata. */
  entry: TrailEntry | undefined
  /** Mounting node container reference. */
  mountRef: RefObject<HTMLDivElement | null>
}

/**
 * Hook that dynamically tracks popover dimensions and viewport limits to calculate coordinates.
 */
export function usePopoverGeometry({
  id,
  anchorRect,
  direction,
  zIndex,
  onPosition,
  ref,
  isDragging,
  isPinned,
  entry,
  mountRef,
}: UsePopoverGeometryOptions) {
  const [dimensions, setDimensions] = useState({width: 0, height: 0})
  const [resizeVersion, setResizeVersion] = useState(0)
  const [layoutPos, setLayoutPos] = useState({top: 0, left: -9999})

  useEffect(() => {
    const handleResize = () => {
      setResizeVersion((v) => v + 1)
    }
    window.addEventListener('resize', handleResize)

    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined' && ref.current) {
      observer = new ResizeObserver((entries) => {
        for (const resizeEntry of entries) {
          const {width, height} = resizeEntry.contentRect
          setDimensions((prev) => {
            if (prev.width === width && prev.height === height) {
              return prev
            }
            setResizeVersion((v) => v + 1)
            return {width, height}
          })
        }
      })
      observer.observe(ref.current)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      observer?.disconnect()
    }
  }, [ref])

  const finalLayoutPos = isPinned && entry?.pinnedLayoutPos ? entry.pinnedLayoutPos : layoutPos

  useLayoutEffect(() => {
    if (isDragging) {
      return
    }

    if (!ref.current) {
      return
    }

    const el = ref.current
    const rect = el.getBoundingClientRect()
    const popoverWidth = dimensions.width || rect.width
    const popoverHeight = dimensions.height || rect.height

    let baseTop: number
    let baseLeft: number

    if (isPinned && entry?.pinnedLayoutPos) {
      baseTop = entry.pinnedLayoutPos.top
      baseLeft = entry.pinnedLayoutPos.left
    } else {
      const basePos = calculateBasePosition({
        anchorRect,
        popoverWidth,
        popoverHeight,
        direction,
        zIndex,
        viewport: {width: globalThis.innerWidth, height: globalThis.innerHeight},
        gap: POPOVER_LAYOUT.GAP,
        margin: 12,
      })
      baseTop = basePos.top
      baseLeft = basePos.left
    }

    setLayoutPos((prev) => {
      if (prev.top === baseTop && prev.left === baseLeft) {
        return prev
      }
      return {top: baseTop, left: baseLeft}
    })

    onPosition()
    mountRef.current ??= el
  }, [
    anchorRect,
    direction,
    isDragging,
    isPinned,
    mountRef,
    onPosition,
    id,
    entry?.pinnedLayoutPos,
    zIndex,
    resizeVersion,
    dimensions.width,
    dimensions.height,
    ref,
  ])

  return {
    dimensions,
    finalLayoutPos,
    resizeVersion,
  }
}
