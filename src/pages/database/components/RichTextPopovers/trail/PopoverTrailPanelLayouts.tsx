import React, {isValidElement, useCallback, useEffect, useState, type ReactNode} from 'react'

import type {TrailEntry} from '@/pages/database/utils/popover-trail'

import {SinglePopover} from './SinglePopover'

type MobilePopoverTrailPanelProps = Readonly<{
  children: ReactNode[]
  itemCount: number
  onCloseTop: () => void
  containerRef: React.RefObject<HTMLDivElement | null>
}>

type DesktopPopoverTrailPanelProps = Readonly<{
  children: ReactNode[]
  currentAnchorRect: DOMRect
  trailRects?: (DOMRect | undefined)[]
  direction: 'up' | 'down'
  containerRef: React.RefObject<HTMLDivElement | null>
  trail?: TrailEntry[]
  floating?: TrailEntry[]
}>

export function MobilePopoverTrailPanel({
  children,
  itemCount,
  onCloseTop,
  containerRef,
}: MobilePopoverTrailPanelProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10)
    return () => {
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      className='pointer-events-none fixed right-0 bottom-4 left-0 z-950 flex flex-col items-center px-4'
      data-skill-popover=''
      ref={containerRef}
    >
      <div
        className='pointer-events-auto flex w-full max-w-[min(24rem,100%)] flex-col items-center'
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'none' : 'translateY(10px)',
          transition: 'transform 300ms ease-out, opacity 250ms ease-out',
        }}
      >
        {itemCount > 1 && (
          <button
            className='mb-3 flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-slate-900 px-4 py-2 text-[11px] font-bold tracking-wide text-amber-100 shadow-xl active:scale-95'
            onClick={onCloseTop}
            type='button'
          >
            <span className='text-amber-400'>&#8592;</span>
            <span>BACK</span>
          </button>
        )}
        <div className='flex w-full justify-center shadow-2xl'>{children[itemCount - 1]}</div>
      </div>
    </div>
  )
}

export function DesktopPopoverTrailPanel({
  children,
  currentAnchorRect,
  trailRects,
  direction,
  containerRef,
  trail = [],
  floating = [],
}: DesktopPopoverTrailPanelProps) {
  const positionNoop = useCallback(() => {
    return undefined
  }, [])

  const allEntries = [...floating, ...trail]

  return (
    <div data-skill-popover='' ref={containerRef}>
      {children.map((child, index) => {
        const entry = allEntries[index] as TrailEntry | undefined
        const isFloating = index < floating.length
        const trailIndex = isFloating ? -1 : index - floating.length

        const rect = isFloating
          ? (entry?.rect ?? currentAnchorRect)
          : trailIndex === 0
            ? currentAnchorRect
            : (entry?.rect ?? trailRects?.[trailIndex] ?? entry?.rect ?? currentAnchorRect)

        const entryDirection = entry?.direction ?? direction
        const childKey = entry
          ? entry.key
          : isValidElement(child) && child.key !== null
            ? child.key
            : `popover-${String(index)}`

        return (
          <SinglePopover
            anchorRect={rect}
            direction={entryDirection}
            id={childKey}
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
