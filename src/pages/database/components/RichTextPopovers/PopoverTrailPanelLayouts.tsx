import React, {isValidElement, useCallback, useLayoutEffect, useRef, type ReactNode} from 'react'

type SinglePopoverProps = Readonly<{
  anchorRect: DOMRect
  direction: 'up' | 'down'
  zIndex: number
  children: ReactNode
  mountRef: React.RefObject<HTMLDivElement | null>
  onPosition: () => void
}>

type MobilePopoverTrailPanelProps = Readonly<{
  children: ReactNode[]
  itemCount: number
  onCloseTop: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}>

type DesktopPopoverTrailPanelProps = Readonly<{
  children: ReactNode[]
  currentAnchorRect: DOMRect
  entryRects?: (DOMRect | undefined)[]
  direction: 'up' | 'down'
  containerRef: React.RefObject<HTMLDivElement | null>
}>

function SinglePopover({
  anchorRect,
  direction,
  zIndex,
  children,
  mountRef,
  onPosition,
}: SinglePopoverProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const rect = el.getBoundingClientRect()
    const vw = globalThis.innerWidth
    const vh = globalThis.innerHeight
    const margin = 12
    const gap = 6

    let left = anchorRect.left
    if (left + rect.width > vw - margin) {
      left = vw - rect.width - margin
    }
    if (left < margin) {
      left = margin
    }

    let top = direction === 'up' ? anchorRect.top - gap - rect.height : anchorRect.bottom + gap

    if (top + rect.height > vh - margin) {
      top = vh - rect.height - margin
    }
    if (top < margin) {
      top = margin
    }

    el.style.top = `${String(top)}px`
    el.style.left = `${String(left)}px`
    onPosition()
    mountRef.current ??= el
  }, [anchorRect, direction, mountRef, onPosition])

  return (
    <div
      className='fixed max-h-[calc(100vh-24px)] w-[min(22rem,calc(100vw-24px))] bg-transparent shadow-none'
      ref={ref}
      style={{top: 0, left: -9999, zIndex: 950 + zIndex}}
    >
      {children}
    </div>
  )
}

export function MobilePopoverTrailPanel({
  children,
  itemCount,
  onCloseTop,
  containerRef,
}: MobilePopoverTrailPanelProps) {
  return (
    <div
      className='fixed bottom-4 left-1/2 z-950 flex w-[min(22rem,calc(100vw-24px))] -translate-x-1/2 flex-col items-center'
      data-skill-popover=''
      ref={containerRef}
    >
      {itemCount > 1 && (
        <button
          className='mb-1.5 flex items-center gap-1.5 border border-slate-700/60 bg-slate-950/98 px-3 py-1.5 text-xs font-semibold text-amber-200/80 shadow-lg backdrop-blur transition-colors hover:border-amber-500/60 hover:text-amber-100'
          onClick={onCloseTop}
          type='button'
        >
          <span className='text-amber-400'>&#8592;</span>
          <span>Back</span>
        </button>
      )}
      <div className='w-max max-w-full'>{children[itemCount - 1]}</div>
    </div>
  )
}

export function DesktopPopoverTrailPanel({
  children,
  currentAnchorRect,
  entryRects,
  direction,
  containerRef,
}: DesktopPopoverTrailPanelProps) {
  const positionNoop = useCallback(() => undefined, [])

  return (
    <div data-skill-popover='' ref={containerRef}>
      {children.map((child, index) => {
        const entryRect = entryRects?.[index]
        const rect = index === 0 ? currentAnchorRect : (entryRect ?? currentAnchorRect)
        const childKey =
          isValidElement(child) && child.key !== null
            ? child.key
            : `popover-${String(rect.left)}-${String(rect.top)}-${String(rect.width)}-${String(
                rect.height,
              )}`
        return (
          <SinglePopover
            anchorRect={rect}
            direction={direction}
            key={childKey}
            mountRef={containerRef}
            onPosition={positionNoop}
            zIndex={index}
          >
            {child}
          </SinglePopover>
        )
      })}
    </div>
  )
}
