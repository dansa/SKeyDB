import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {useDraggable} from '@dnd-kit/core'

import {POPOVER_LAYOUT} from '../core/popover-config'
import {PopoverDragProvider} from '../core/PopoverDragContext'
import {usePopoverStore} from './usePopoverStore'

export interface SinglePopoverProps {
  id: string
  anchorRect: DOMRect
  direction: 'up' | 'down'
  zIndex: number
  children: ReactNode
  mountRef: React.RefObject<HTMLDivElement | null>
  onPosition: () => void
}

const DEFAULT_OFFSET = {x: 0, y: 0}

export function SinglePopover({
  id,
  anchorRect,
  direction,
  zIndex,
  children,
  mountRef,
  onPosition,
}: SinglePopoverProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const offset = usePopoverStore((state) => state.offsets[id] ?? DEFAULT_OFFSET)
  const [layoutPos, setLayoutPos] = useState({top: 0, left: -9999})
  const [pinnedLayoutPos, setPinnedLayoutPos] = useState<{top: number; left: number} | null>(null)

  const lastDragX = useRef(0)
  const lastTime = useRef(0)
  const transformXRef = useRef(0)
  const [rotation, setRotation] = useState(0)

  const {attributes, listeners, setNodeRef, transform, isDragging} = useDraggable({
    id,
  })

  useEffect(() => {
    transformXRef.current = transform?.x ?? 0
  }, [transform?.x])

  if (!isDragging && rotation !== 0) {
    setRotation(0)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  const isPinned = usePopoverStore((state) => state.pinnedKeys[id] ?? false)
  const updateOffset = usePopoverStore((state) => state.updateOffset)

  if (!isPinned && pinnedLayoutPos !== null) {
    setPinnedLayoutPos(null)
  }

  useLayoutEffect(() => {
    if (isDragging) return
    if (!ref.current) return

    const el = ref.current
    const rect = el.getBoundingClientRect()
    const vw = globalThis.innerWidth
    const vh = globalThis.innerHeight
    const gap = POPOVER_LAYOUT.GAP

    let baseTop: number
    let baseLeft: number

    if (isPinned && pinnedLayoutPos) {
      baseTop = pinnedLayoutPos.top
      baseLeft = pinnedLayoutPos.left
    } else {
      let left = anchorRect.left
      if (left + rect.width > vw) {
        left = vw - rect.width
      }
      if (left < 0) {
        left = 0
      }

      const isNested = zIndex > 0
      const verticalGap = isNested ? 2 : gap

      let top =
        direction === 'up'
          ? anchorRect.top - verticalGap - rect.height
          : anchorRect.bottom + verticalGap

      if (top + rect.height > vh) {
        top = vh - rect.height
      }
      if (top < 0) {
        top = 0
      }

      baseTop = Math.round(top)
      baseLeft = Math.round(left)

      if (isPinned) {
        setPinnedLayoutPos({top: baseTop, left: baseLeft})
      }
    }

    setLayoutPos((prev) => {
      if (prev.top === baseTop && prev.left === baseLeft) return prev
      return {top: baseTop, left: baseLeft}
    })

    const hLimit = 40
    const currentTop = baseTop + offset.y
    const currentLeft = baseLeft + offset.x

    const clampedTop = Math.max(0, Math.min(vh - hLimit, currentTop))
    const clampedLeft = Math.max(0, Math.min(vw - rect.width, currentLeft))

    if (Math.abs(clampedTop - currentTop) > 0.5 || Math.abs(clampedLeft - currentLeft) > 0.5) {
      updateOffset(id, Math.round(clampedLeft - baseLeft), Math.round(clampedTop - baseTop))
    }

    onPosition()
    mountRef.current ??= el
  }, [
    anchorRect,
    direction,
    isDragging,
    isPinned,
    mountRef,
    onPosition,
    offset.x,
    offset.y,
    updateOffset,
    id,
    pinnedLayoutPos,
    zIndex,
  ])

  useEffect(() => {
    if (!isDragging) {
      return
    }

    let rafId: number
    const updateRotation = () => {
      const now = performance.now()
      const dt = Math.max(1, now - lastTime.current)
      const currentDragX = transformXRef.current
      const velocity = (currentDragX - lastDragX.current) / dt

      setRotation((prev) => {
        const next = prev * 0.9 + velocity * 8 * 0.1
        return Math.max(-4, Math.min(4, next))
      })

      lastDragX.current = currentDragX
      lastTime.current = now
      rafId = requestAnimationFrame(updateRotation)
    }

    lastTime.current = performance.now()
    lastDragX.current = transformXRef.current
    rafId = requestAnimationFrame(updateRotation)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [isDragging])

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      if (node) {
        setNodeRef(node)
      }
    },
    [setNodeRef],
  )

  const dragX = transform?.x ?? 0
  const dragY = transform?.y ?? 0
  const slideOffset =
    direction === 'up'
      ? POPOVER_LAYOUT.ANIMATION_SLIDE_OFFSET
      : -POPOVER_LAYOUT.ANIMATION_SLIDE_OFFSET
  const currentY = offset.y + dragY + (!isVisible ? slideOffset : 0)

  const finalLayoutPos = isPinned && pinnedLayoutPos ? pinnedLayoutPos : layoutPos

  const totalX = isDragging ? offset.x + dragX : Math.round(offset.x + dragX)
  const totalY = isDragging ? currentY : Math.round(currentY)

  const style: React.CSSProperties = {
    top: Math.round(finalLayoutPos.top),
    left: Math.round(finalLayoutPos.left),
    zIndex: POPOVER_LAYOUT.BASE_Z_INDEX + zIndex,
    transform: `translate3d(${String(totalX)}px, ${String(totalY)}px, 0) rotate(${String(rotation)}deg)`,
    opacity: !isVisible ? 0 : 1,
    filter: 'none',
    boxShadow: isDragging
      ? '0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 12px 24px -18px rgba(0, 0, 0, 0.4)'
      : '0 8px 12px -2px rgba(0, 0, 0, 0.3)',
    transitionProperty: isDragging ? 'none' : 'opacity, transform, box-shadow',
    transitionDuration: isDragging ? '0ms' : '250ms',
    transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  }

  const togglePin = usePopoverStore((state) => state.togglePin)
  const handleTogglePin = useCallback(() => {
    togglePin(id)
  }, [id, togglePin])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prevent = (e: Event) => {
      e.preventDefault()
    }
    el.addEventListener('selectstart', prevent)
    return () => {
      el.removeEventListener('selectstart', prevent)
    }
  }, [])

  return (
    <div
      className={`fixed w-fit max-w-[min(${String(POPOVER_LAYOUT.MAX_WIDTH)}px,calc(100vw-24px))] max-h-[calc(100vh-24px)] bg-transparent shadow-none select-none ${
        !isVisible ? 'pointer-events-none' : ''
      } ${isPinned ? 'ring-1 ring-amber-400/20' : ''}`}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault()
      }}
      ref={setCombinedRef}
      style={{
        ...style,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
      }}
    >
      <div className='h-full w-full'>
        <PopoverDragProvider
          value={{
            dragListeners: listeners ?? undefined,
            dragAttributes: attributes,
            isPinned,
            onTogglePin: handleTogglePin,
          }}
        >
          {children}
        </PopoverDragProvider>
      </div>
    </div>
  )
}
