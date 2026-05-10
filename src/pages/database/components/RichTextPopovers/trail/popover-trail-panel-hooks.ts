import {useEffect, useState} from 'react'

import {usePopoverStore} from './usePopoverStore'

export function usePopoverTrailViewportVersion() {
  const [viewportVersion, setViewportVersion] = useState(0)

  useEffect(() => {
    let rafId: number | null = null
    const handleViewportChange = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        setViewportVersion((value) => value + 1)
        rafId = null
      })
    }

    globalThis.addEventListener('resize', handleViewportChange, {passive: true})
    globalThis.addEventListener('scroll', handleViewportChange, {passive: true, capture: true})
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      globalThis.removeEventListener('resize', handleViewportChange)
      globalThis.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [])

  return viewportVersion
}

export function usePopoverTrailDismiss(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onCloseTop: () => void,
) {
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        const hasPinned = Object.keys(usePopoverStore.getState().pinnedKeys).length > 0
        if (!hasPinned) {
          onCloseTop()
        }
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseTop()
      }
    }

    let scrollRafId: number | null = null
    function handleScroll() {
      if (scrollRafId !== null) return
      scrollRafId = requestAnimationFrame(() => {
        scrollRafId = null
        const hasPinned = Object.keys(usePopoverStore.getState().pinnedKeys).length > 0
        if (hasPinned) return

        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const vh = globalThis.innerHeight
        const vw = globalThis.innerWidth
        const halfH = rect.height / 2
        const halfW = rect.width / 2

        const isMoreThanHalfOffScreen =
          rect.bottom < halfH ||
          rect.top > vh - halfH ||
          rect.right < halfW ||
          rect.left > vw - halfW

        if (isMoreThanHalfOffScreen) {
          onCloseTop()
        }
      })
    }

    globalThis.addEventListener('mousedown', handleMouseDown)
    globalThis.addEventListener('keydown', handleEscape)
    globalThis.addEventListener('scroll', handleScroll, {passive: true, capture: true})

    return () => {
      if (scrollRafId !== null) cancelAnimationFrame(scrollRafId)
      globalThis.removeEventListener('mousedown', handleMouseDown)
      globalThis.removeEventListener('keydown', handleEscape)
      globalThis.removeEventListener('scroll', handleScroll, true)
    }
  }, [containerRef, onCloseTop])
}
