import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from 'react'

import {getFocusableElements} from '@/ui/modal/focus-scope'

import {getDescriptionFontScaleStyle, type FontScale} from './font-scale'
import {decideTrailDirection, isTrailMobileLayout} from './popover-trail'
import {useSuppressDetailEntitySearchCapture} from './useDetailEntitySearch'

interface PopoverTrailPanelProps {
  anchorRect: DOMRect
  anchorElement?: HTMLElement | null
  itemCount: number
  onCloseAll: () => void
  fontScale?: FontScale
  children?: ReactNode
}

export function PopoverTrailPanel({
  anchorRect,
  anchorElement,
  itemCount,
  onCloseAll,
  fontScale = 'small',
  children,
}: PopoverTrailPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const desktopCloseAllRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)
  const [viewportVersion, setViewportVersion] = useState(0)
  const [manualPosition, setManualPosition] = useState<{left: number; top: number} | null>(null)
  const isMobile = isTrailMobileLayout(window.innerWidth)
  const currentAnchorRect = anchorElement?.isConnected
    ? anchorElement.getBoundingClientRect()
    : anchorRect
  const direction = isMobile ? 'down' : decideTrailDirection(currentAnchorRect, window.innerHeight)
  useSuppressDetailEntitySearchCapture()

  const positionPanel = useCallback(() => {
    if (!ref.current || isMobile) {
      return
    }

    const el = ref.current
    const rect = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const margin = 12
    const gap = 6
    const activeAnchorRect = anchorElement?.isConnected
      ? anchorElement.getBoundingClientRect()
      : anchorRect
    const desktopCloseAllHeight =
      direction === 'down' ? (desktopCloseAllRef.current?.getBoundingClientRect().height ?? 0) : 0

    let left = manualPosition?.left ?? activeAnchorRect.left
    let top =
      manualPosition?.top ??
      (direction === 'up'
        ? activeAnchorRect.top - gap - rect.height
        : activeAnchorRect.bottom + gap - desktopCloseAllHeight)

    if (left + rect.width > vw - margin) {
      left = vw - rect.width - margin
    }
    if (left < margin) {
      left = margin
    }

    if (top + rect.height > vh - margin) {
      top = vh - rect.height - margin
    }
    if (top < margin) {
      top = margin
    }

    el.style.top = `${String(top)}px`
    el.style.left = `${String(left)}px`
  }, [anchorElement, anchorRect, direction, isMobile, manualPosition])

  useLayoutEffect(() => {
    positionPanel()
  }, [itemCount, positionPanel, viewportVersion])

  useEffect(() => {
    function handleViewportChange() {
      setViewportVersion((v) => v + 1)
    }
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)
    return () => {
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [])

  useEffect(() => {
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()

    return () => {
      if (anchorElement?.isConnected) {
        anchorElement.focus()
        return
      }
      previouslyFocusedElementRef.current?.focus()
    }
  }, [anchorElement])

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (isMobile || !ref.current) {
        return
      }

      const target = event.target as HTMLElement
      if (!target.closest('[data-popover-drag-handle]')) {
        return
      }
      if (target.closest('button, a, input, select, textarea, [role="button"]')) {
        return
      }

      const panelRect = ref.current.getBoundingClientRect()
      const pointerOffsetX = event.clientX - panelRect.left
      const pointerOffsetY = event.clientY - panelRect.top
      const previousUserSelect = document.body.style.userSelect

      document.body.style.userSelect = 'none'
      const nextTarget = event.currentTarget
      nextTarget.setPointerCapture(event.pointerId)

      const handlePointerMove = (moveEvent: PointerEvent) => {
        setManualPosition({
          left: moveEvent.clientX - pointerOffsetX,
          top: moveEvent.clientY - pointerOffsetY,
        })
      }

      const handlePointerUp = () => {
        document.body.style.userSelect = previousUserSelect
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [isMobile],
  )

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onCloseAll()
        return
      }

      if (event.key !== 'Tab' || !ref.current) {
        return
      }

      const focusableElements = getFocusableElements(ref.current)
      if (focusableElements.length === 0) {
        event.preventDefault()
        ref.current.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

      if (event.shiftKey) {
        if (!activeElement || activeElement === firstElement || activeElement === ref.current) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (!activeElement || activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    },
    [onCloseAll],
  )

  return (
    <div
      aria-label='Database reference details'
      className={`database-scrollbar fixed z-[950] overflow-y-auto ${
        isMobile
          ? 'inset-x-3 bottom-3 max-h-[min(72vh,34rem)]'
          : 'max-h-[calc(100vh-24px)] w-[min(22rem,calc(100vw-24px))]'
      }`}
      data-skill-popover=''
      onClick={(e) => {
        e.stopPropagation()
      }}
      onKeyDown={handleKeyDown}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      onPointerDown={handlePointerDown}
      ref={ref}
      role='dialog'
      style={
        isMobile
          ? getDescriptionFontScaleStyle(fontScale)
          : {top: 0, left: -9999, ...getDescriptionFontScaleStyle(fontScale)}
      }
      tabIndex={-1}
    >
      {!isMobile ? (
        <div
          className='pointer-events-none sticky top-0 z-[1] flex justify-end px-2 pt-2'
          ref={desktopCloseAllRef}
        >
          <button
            className='pointer-events-auto border border-slate-600/55 bg-slate-950/92 px-2 py-1 text-[10px] tracking-[0.14em] text-slate-300 uppercase transition-colors hover:border-amber-200/55 hover:text-amber-100'
            onClick={onCloseAll}
            ref={closeButtonRef}
            type='button'
          >
            Close all
          </button>
        </div>
      ) : null}
      <div className={`flex gap-2 ${direction === 'up' ? 'flex-col-reverse' : 'flex-col'}`}>
        {children}
      </div>
      {isMobile ? (
        <div className='sticky bottom-0 mt-2 border-t border-slate-700/60 bg-slate-950/96 px-3 py-2'>
          <button
            className='w-full border border-slate-600/55 bg-slate-900/85 px-3 py-2 text-[11px] tracking-[0.14em] text-slate-200 uppercase transition-colors hover:border-amber-200/55 hover:text-amber-100'
            onClick={onCloseAll}
            ref={closeButtonRef}
            type='button'
          >
            Close all
          </button>
        </div>
      ) : null}
    </div>
  )
}
