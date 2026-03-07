import {useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react'

import {decideTrailDirection, isTrailMobileLayout} from './popover-trail'

interface PopoverTrailPanelProps {
  anchorRect: DOMRect
  anchorElement?: HTMLElement | null
  itemCount: number
  onCloseTop: () => void
  children: ReactNode
}

export function PopoverTrailPanel({
  anchorRect,
  anchorElement,
  itemCount,
  onCloseTop,
  children,
}: PopoverTrailPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [viewportVersion, setViewportVersion] = useState(0)
  const isMobile = isTrailMobileLayout(window.innerWidth)
  const currentAnchorRect = anchorElement?.isConnected
    ? anchorElement.getBoundingClientRect()
    : anchorRect
  const direction = isMobile ? 'down' : decideTrailDirection(currentAnchorRect, window.innerHeight)

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

    let left = activeAnchorRect.left
    if (left + rect.width > vw - margin) {
      left = vw - rect.width - margin
    }
    if (left < margin) {
      left = margin
    }

    let top =
      direction === 'up' ? activeAnchorRect.top - gap - rect.height : activeAnchorRect.bottom + gap
    if (top + rect.height > vh - margin) {
      top = vh - rect.height - margin
    }
    if (top < margin) {
      top = margin
    }

    el.style.top = `${String(top)}px`
    el.style.left = `${String(left)}px`
  }, [anchorElement, anchorRect, direction, isMobile])

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
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onCloseTop()
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseTop()
      }
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('keydown', handleEscape)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [onCloseTop])

  return (
    <div
      className={`fixed z-[950] overflow-y-auto ${
        isMobile
          ? 'inset-x-3 bottom-3 max-h-[min(72vh,34rem)]'
          : 'max-h-[calc(100vh-24px)] w-[min(22rem,calc(100vw-24px))]'
      }`}
      data-skill-popover=''
      onClick={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
      }}
      ref={ref}
      style={isMobile ? undefined : {top: 0, left: -9999}}
    >
      <div className={`flex gap-2 ${direction === 'up' ? 'flex-col-reverse' : 'flex-col'}`}>
        {children}
      </div>
    </div>
  )
}
