import React, {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {useDraggable} from '@dnd-kit/core'

import {POPOVER_LAYOUT} from '../core/popover-config'
import {getPopoverWidthStyle} from './DatabaseReferencePopoverHelpers'
import {getDescriptionFontScaleStyle} from './font-scale'
import {clampOffset} from './popover-layout-math'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'
import {usePopoverDragAndDrop} from './usePopoverDragAndDrop'
import {usePopoverGeometry} from './usePopoverGeometry'
import {
  useIsPopoverPinned,
  useIsPopoverTopMost,
  usePopoverActions,
  usePopoverEntry,
  usePopoverOffset,
  usePopoverZIndex,
} from './usePopoverStore'

function noop(): void {
  return undefined
}

/**
 * Helper function to query all focusable elements inside a DOM node.
 * @param container Bounded DOM container element.
 * @returns Array of focusable HTML elements.
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return []
  }
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled'))
}

/**
 * Interface properties for the DraggablePopoverWrapper component.
 */
export interface DraggablePopoverWrapperProps {
  id: string
  anchorRect: DOMRect
  direction: 'up' | 'down'
  zIndex: number
  children: ReactNode
  mountRef: React.RefObject<HTMLDivElement | null>
  onPosition?: () => void
}

export function DraggablePopoverWrapper({
  id,
  anchorRect,
  direction,
  zIndex,
  children,
  mountRef,
  onPosition = noop,
}: DraggablePopoverWrapperProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const {preferences} = useDatabaseDetailPreferences()
  const fontScaleStyle = getDescriptionFontScaleStyle(preferences.shared.fontScale)
  const offset = usePopoverOffset(id)
  const {bringToFront, updateOffset} = usePopoverActions()
  const entry = usePopoverEntry(id)
  const isPinned = useIsPopoverPinned(id)
  const storeIndex = usePopoverZIndex(id)
  const finalZIndex = storeIndex !== -1 ? storeIndex : zIndex

  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id,
  })

  const draggableAttributes = useMemo(
    () => ({
      ...attributes,
      role: 'dialog',
      tabIndex: -1,
    }),
    [attributes],
  )

  const {dimensions, finalLayoutPos} = usePopoverGeometry({
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
  })

  const {rotation, dragX, dragY} = usePopoverDragAndDrop({
    isDragging,
    transform,
  })

  const widthInfo = useMemo(() => {
    if (!entry) return null
    return getPopoverWidthStyle(entry)
  }, [entry])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const preventSelect = (e: Event) => {
      if (isDragging) {
        e.preventDefault()
      }
    }
    el.addEventListener('selectstart', preventSelect)
    return () => {
      el.removeEventListener('selectstart', preventSelect)
    }
  }, [isDragging])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      if (node) {
        setNodeRef(node)
      }
    },
    [setNodeRef],
  )

  const slideOffset =
    direction === 'up'
      ? POPOVER_LAYOUT.ANIMATION_SLIDE_OFFSET
      : -POPOVER_LAYOUT.ANIMATION_SLIDE_OFFSET
  const currentY = offset.y + dragY + (!isVisible ? slideOffset : 0)
  const totalX = isDragging ? offset.x + dragX : Math.round(offset.x + dragX)
  const totalY = isDragging ? currentY : Math.round(currentY)

  const displayOffset = clampOffset({
    targetLeft: finalLayoutPos.left + totalX,
    targetTop: finalLayoutPos.top + totalY,
    popoverWidth: dimensions.width,
    popoverHeight: dimensions.height,
    viewport: {width: globalThis.innerWidth, height: globalThis.innerHeight},
    margin: 12,
    layoutLeft: finalLayoutPos.left,
    layoutTop: finalLayoutPos.top,
  })

  const widthStyle = useMemo(() => {
    if (!widthInfo) return {}
    const scale = 'var(--desc-font-scale, 1)'
    const baseWidth = widthInfo.baseWidth
    const isWheel = id.startsWith('wheel')
    return {
      width: isWheel ? `calc(${scale} * ${String(baseWidth)}px)` : 'fit-content',
      minWidth: `calc(${scale} * 160px)`,
      maxWidth: `min(95vw, calc(${scale} * ${String(baseWidth)}px))`,
    }
  }, [id, widthInfo])

  const style: React.CSSProperties = {
    top: Math.round(finalLayoutPos.top),
    left: Math.round(finalLayoutPos.left),
    zIndex: POPOVER_LAYOUT.BASE_Z_INDEX + finalZIndex,
    transform: `translate3d(${String(displayOffset.x)}px, ${String(displayOffset.y)}px, 0) rotate(${String(rotation)}deg)`,
    opacity: !isVisible ? 0 : 1,
    filter: 'none',
    boxShadow: isDragging
      ? '0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 12px 24px -18px rgba(0, 0, 0, 0.4)'
      : '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
    transitionProperty: isDragging ? 'none' : 'opacity, box-shadow',
    transitionDuration: isDragging ? '0ms' : '250ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    resize: 'none',
    overflow: 'visible',
    ...widthStyle,
  }

  const handleFocusAndClamp = useCallback(() => {
    bringToFront(id)
    const nextOffset = clampOffset({
      targetLeft: finalLayoutPos.left + offset.x,
      targetTop: finalLayoutPos.top + offset.y,
      popoverWidth: dimensions.width,
      popoverHeight: dimensions.height,
      viewport: {width: globalThis.innerWidth, height: globalThis.innerHeight},
      margin: 12,
      layoutLeft: finalLayoutPos.left,
      layoutTop: finalLayoutPos.top,
    })
    if (nextOffset.x !== offset.x || nextOffset.y !== offset.y) {
      updateOffset(id, nextOffset.x, nextOffset.y)
    }
  }, [
    id,
    bringToFront,
    finalLayoutPos.left,
    finalLayoutPos.top,
    offset.x,
    offset.y,
    dimensions.width,
    dimensions.height,
    updateOffset,
  ])

  const isTopMost = useIsPopoverTopMost(id)

  const getFocusables = useCallback(() => {
    return getFocusableElements(ref.current)
  }, [])

  useEffect(() => {
    if (isTopMost && ref.current && isVisible) {
      const focusables = getFocusables()
      if (focusables.length > 0) {
        focusables[0].focus()
      } else {
        ref.current.focus()
      }
    }
  }, [isTopMost, isVisible, getFocusables])

  const getFocusablesEvent = useEffectEvent(getFocusables)

  useEffect(() => {
    if (!isVisible || !isTopMost) {
      return
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') {
        return
      }
      const focusables = getFocusablesEvent()
      if (focusables.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    const el = ref.current
    if (!el) return
    el.addEventListener('keydown', handleFocusTrap)
    return () => {
      el.removeEventListener('keydown', handleFocusTrap)
    }
  }, [isTopMost, isVisible])

  return (
    <div
      data-popover-id={id}
      aria-modal='false'
      aria-label='Database reference details'
      className={`fixed flex max-h-[calc(100vh-24px)] w-fit bg-transparent shadow-none ${isDragging ? 'select-none' : ''} ${
        !isVisible ? 'pointer-events-none' : 'pointer-events-auto'
      } ${isPinned ? 'ring-1 ring-amber-400/20' : ''} focus:outline-none`}
      data-skill-popover=''
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault()
      }}
      onMouseDownCapture={handleFocusAndClamp}
      onTouchStartCapture={handleFocusAndClamp}
      ref={setCombinedRef}
      style={{
        ...style,
        ...fontScaleStyle,
        userSelect: isDragging ? 'none' : undefined,
        WebkitUserSelect: isDragging ? 'none' : undefined,
        touchAction: 'none',
      }}
      {...draggableAttributes}
      {...listeners}
    >
      {children}
    </div>
  )
}
