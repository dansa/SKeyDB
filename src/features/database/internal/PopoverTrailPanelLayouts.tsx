import React, {
  isValidElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import type {DatabasePopoverPortalEntry} from './DatabasePopoverPortal'
import {DraggablePopoverWrapper} from './DraggablePopoverWrapper'
import {getDescriptionFontScaleStyle} from './font-scale'
import type {TrailEntry} from './popover-trail'
import {useDatabaseDetailPreferences} from './useDatabaseDetailPreferences'

/**
 * Properties for the MobilePopoverTrailPanel component.
 */
type MobilePopoverTrailPanelProps = Readonly<{
  /** Active popover portal entries to render. */
  entries?: DatabasePopoverPortalEntry[]
  /** Renderer callback for rendering individual entries. */
  renderEntry?: (entry: DatabasePopoverPortalEntry) => ReactNode
  /** Direct React node children fallback. */
  children?: ReactNode
  /** Count of active items in stack. */
  itemCount: number
  /** Callback to trigger when the top-most popover is dismissed. */
  onCloseTop: () => void
  /** Ref to the mobile panel container. */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Callback to trigger when all popovers are closed (e.g. clicking the backdrop). */
  onCloseAll?: () => void
}>

/**
 * Properties for the DesktopPopoverTrailPanel component.
 */
type DesktopPopoverTrailPanelProps = Readonly<{
  /** Bounded portal entries stack. */
  entries?: DatabasePopoverPortalEntry[]
  /** Entry rendering callback function. */
  renderEntry?: (entry: DatabasePopoverPortalEntry) => ReactNode
  /** Direct React node children fallback. */
  children?: ReactNode
  /** Current active base anchor element bounding box rect. */
  currentAnchorRect: DOMRect | null
  /** Preferred layout direction: 'up' or 'down'. */
  direction: 'up' | 'down'
  /** Ref to the desktop panel container. */
  containerRef: React.RefObject<HTMLDivElement | null>
}>

interface RenderEntryWrapperProps {
  entryRenderer: (entry: DatabasePopoverPortalEntry) => ReactNode
  entry: DatabasePopoverPortalEntry
}
function RenderEntryWrapper({entryRenderer, entry}: RenderEntryWrapperProps) {
  return <>{entryRenderer(entry)}</>
}

/**
 * Visual item wrapper container for mobile popovers supporting sliding drawer animations.
 */
function MobilePopoverItemWrapper({
  children,
  isActive,
  isDragging,
  dragOffset,
  isClosing,
}: {
  children: ReactNode
  isActive: boolean
  isBehind: boolean
  isDragging: boolean
  dragOffset: number
  isClosing: boolean
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsMounted(true)
    })
    return () => {
      cancelAnimationFrame(handle)
    }
  }, [])

  const isVisible = isActive || isClosing
  const currentOffset = isActive ? dragOffset : 0
  const showTransform = isMounted && !isClosing

  const scale = isActive ? 1 : 0.93
  const translateY = isActive ? currentOffset : -14
  const opacity = isActive ? 1 : 0.5

  return (
    <div
      className={`max-h-[82vh] w-full overflow-y-auto border-x border-t border-amber-200/10 bg-slate-950 pb-[env(safe-area-inset-bottom,20px)] shadow-2xl transition-all duration-300 ${
        isVisible
          ? isActive
            ? 'pointer-events-auto relative z-10'
            : 'pointer-events-none absolute inset-x-0 bottom-0 z-0'
          : 'pointer-events-none invisible absolute inset-x-0 bottom-0 z-0 opacity-0'
      }`}
      style={{
        transform: showTransform
          ? `translateY(${translateY.toString()}px) scale(${scale.toString()})`
          : 'translateY(100%) scale(1)',
        transformOrigin: 'bottom center',
        opacity: isVisible ? opacity : 0,
        transition:
          isActive && isDragging
            ? 'none'
            : 'transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 280ms ease-out',
      }}
    >
      {isVisible && (
        <div className='pointer-events-none absolute top-1.5 left-1/2 z-20 h-1 w-10 -translate-x-1/2 rounded-full bg-slate-500/40' />
      )}
      {children}
    </div>
  )
}

/**
 * Panel layout component that manages and renders popovers on mobile screens.
 * Renders popovers stacked vertically as a drawer with swipe-down-to-dismiss behavior.
 */
export function MobilePopoverTrailPanel({
  entries,
  renderEntry,
  children,
  itemCount,
  onCloseTop,
  containerRef,
  onCloseAll,
}: MobilePopoverTrailPanelProps) {
  const [closingIndex, setClosingIndex] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDraggingState] = useState(false)
  const isDraggingRef = useRef(false)
  const canDragRef = useRef(false)
  const touchStartY = useRef(0)
  const touchCurrentY = useRef(0)
  const swipeableRef = useRef<HTMLDialogElement>(null)
  const mountTime = useRef(0)
  const {preferences} = useDatabaseDetailPreferences()
  const fontScaleStyle = getDescriptionFontScaleStyle(preferences.shared.fontScale)

  const isBackdropActive = itemCount > 0

  const onCloseTopRef = useRef(onCloseTop)
  useEffect(() => {
    onCloseTopRef.current = onCloseTop
  }, [onCloseTop])

  const prevItemCountRef = useRef(itemCount)
  useLayoutEffect(() => {
    if (itemCount !== prevItemCountRef.current) {
      if (itemCount > prevItemCountRef.current && itemCount > 0) {
        mountTime.current = Date.now()
      }
      prevItemCountRef.current = itemCount
    }
  })

  const setIsDragging = (val: boolean) => {
    isDraggingRef.current = val
    setIsDraggingState(val)
  }

  const handleBackdropClick = useCallback(() => {
    // Ignore clicks within 350ms of a new popover opening to prevent mobile tap ghost clicks
    if (Date.now() - mountTime.current < 350) {
      return
    }
    onCloseAll?.()
  }, [onCloseAll])

  const handleCloseTop = useCallback(() => {
    if (itemCount <= 0) {
      return
    }

    setClosingIndex(itemCount - 1)
    setTimeout(() => {
      onCloseTopRef.current()
      setClosingIndex(null)
      setDragOffset(0)
    }, 250)
  }, [itemCount])

  const handleTouchStart = (e: React.TouchEvent) => {
    canDragRef.current = false
    const path = e.nativeEvent.composedPath()
    for (const el of path) {
      if (el instanceof HTMLElement && el.scrollTop > 0) {
        return
      }
    }

    const touch = e.targetTouches[0] as Touch | undefined
    if (!touch) {
      return
    }
    touchStartY.current = touch.clientY
    touchCurrentY.current = touch.clientY
    canDragRef.current = true
  }

  useEffect(() => {
    const el = swipeableRef.current
    if (!el) {
      return
    }

    const handleTouchMoveNative = (e: TouchEvent) => {
      if (!canDragRef.current) {
        return
      }
      if (e.targetTouches.length === 0) {
        return
      }

      const touch = e.targetTouches[0]
      touchCurrentY.current = touch.clientY
      const deltaY = touchCurrentY.current - touchStartY.current

      // Only engage dragging if swipe moves past 8px in either direction
      if (!isDraggingRef.current && Math.abs(deltaY) > 8) {
        if (deltaY < 0) {
          // Swiping up (trying to scroll down):
          // If there is any scrollable element in the path, cancel drag and allow native scrolling
          const path = e.composedPath()
          for (const el of path) {
            if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight) {
              const style = window.getComputedStyle(el)
              const overflowY = style.overflowY
              const overflow = style.overflow
              if (
                overflowY === 'auto' ||
                overflowY === 'scroll' ||
                overflow === 'auto' ||
                overflow === 'scroll'
              ) {
                canDragRef.current = false
                return
              }
            }
          }
        }
        setIsDragging(true)
      }

      if (isDraggingRef.current) {
        if (deltaY > 0) {
          // Dragging down: normal movement
          if (e.cancelable) {
            e.preventDefault()
          }
          setDragOffset(deltaY)
        } else {
          // Pulling up: apply rubber-banding effect
          if (e.cancelable) {
            e.preventDefault()
          }
          const rubberBandOffset = -Math.sqrt(Math.abs(deltaY)) * 2
          setDragOffset(rubberBandOffset)
        }
      }
    }

    const touchMoveEvent = 'touchmove'
    el.addEventListener(touchMoveEvent, handleTouchMoveNative, {passive: false})
    return () => {
      el.removeEventListener(touchMoveEvent, handleTouchMoveNative)
    }
  }, [])

  const handleTouchEnd = () => {
    canDragRef.current = false
    if (!isDraggingRef.current) {
      return
    }

    setIsDragging(false)
    if (dragOffset > 100) {
      handleCloseTop()
    } else {
      setDragOffset(0)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[960] cursor-pointer bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          isBackdropActive ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={handleBackdropClick}
        aria-hidden='true'
      />
      <div
        className='pointer-events-none fixed right-0 bottom-0 left-0 z-[970] flex flex-col items-center'
        data-skill-popover=''
        ref={containerRef}
        style={fontScaleStyle}
      >
        <dialog
          open
          className='pointer-events-auto m-0 flex w-full max-w-md flex-col items-center border-none bg-transparent p-0'
          aria-label='Database reference details'
          onTouchEnd={handleTouchEnd}
          onTouchStart={handleTouchStart}
          ref={swipeableRef}
        >
          {itemCount > 1 && (
            <button
              className='my-3 flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-slate-900 px-4 py-2 text-[11px] font-bold tracking-wide text-amber-100 shadow-xl active:scale-95'
              onClick={handleCloseTop}
              type='button'
            >
              <span className='text-amber-400'>&#8592;</span>
              <span>BACK</span>
            </button>
          )}
          <div className='relative flex w-full justify-center shadow-2xl'>
            {entries && renderEntry
              ? entries.map((entry, index) => {
                  const isActive = index === itemCount - 1
                  const isBehind = index === itemCount - 2
                  const isClosing = index === closingIndex
                  const modifiedEntry = isActive
                    ? {
                        ...entry,
                        onClose: handleCloseTop,
                      }
                    : entry

                  return (
                    <MobilePopoverItemWrapper
                      key={entry.key}
                      isActive={isActive}
                      isBehind={isBehind}
                      isDragging={isDragging}
                      dragOffset={dragOffset}
                      isClosing={isClosing}
                    >
                      <RenderEntryWrapper entryRenderer={renderEntry} entry={modifiedEntry} />
                    </MobilePopoverItemWrapper>
                  )
                })
              : React.Children.toArray(children).map((child, index) => {
                  const isActive = index === itemCount - 1
                  const isBehind = index === itemCount - 2
                  const isClosing = index === closingIndex
                  const childKey =
                    child && typeof child === 'object' && 'key' in child && child.key
                      ? child.key
                      : `child-${index.toString()}`

                  return (
                    <MobilePopoverItemWrapper
                      key={childKey}
                      isActive={isActive}
                      isBehind={isBehind}
                      isDragging={isDragging}
                      dragOffset={dragOffset}
                      isClosing={isClosing}
                    >
                      {child}
                    </MobilePopoverItemWrapper>
                  )
                })}
          </div>
        </dialog>
      </div>
    </>
  )
}

/**
 * Panel layout component that manages and renders popovers on desktop screens.
 * Supports multiple side-by-side or stacked popovers with draggable capabilities.
 */
export function DesktopPopoverTrailPanel({
  entries,
  renderEntry,
  children,
  currentAnchorRect,
  direction,
  containerRef,
}: DesktopPopoverTrailPanelProps) {
  const activeAnchorRect = currentAnchorRect ?? new DOMRect(0, 0, 0, 0)

  if (entries && renderEntry) {
    return (
      <div ref={containerRef} className='contents'>
        {entries.map((portalEntry, index) => {
          const entry = portalEntry.activeEntry as TrailEntry
          const childKey = portalEntry.key
          const rect = entry.rect ?? activeAnchorRect
          const entryDirection = entry.direction ?? direction
          const computedZIndex = index

          return (
            <DraggablePopoverWrapper
              anchorRect={rect}
              direction={entryDirection}
              id={childKey}
              key={childKey}
              mountRef={containerRef}
              zIndex={computedZIndex}
            >
              <RenderEntryWrapper entryRenderer={renderEntry} entry={portalEntry} />
            </DraggablePopoverWrapper>
          )
        })}
      </div>
    )
  }

  const childArray = React.Children.toArray(children)
  return (
    <div ref={containerRef} className='contents'>
      {childArray.map((child, index) => {
        const childKey =
          child && typeof child === 'object' && 'key' in child && child.key
            ? child.key
            : isValidElement(child) && child.key !== null
              ? child.key
              : `popover-${String(index)}`
        const computedZIndex = index
        return (
          <DraggablePopoverWrapper
            anchorRect={activeAnchorRect}
            direction={direction}
            id={childKey}
            key={childKey}
            mountRef={containerRef}
            zIndex={computedZIndex}
          >
            {child}
          </DraggablePopoverWrapper>
        )
      })}
    </div>
  )
}
