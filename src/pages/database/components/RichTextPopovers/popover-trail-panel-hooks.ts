import {useEffect, useState} from 'react'

export function usePopoverTrailViewportVersion() {
  const [, setViewportVersion] = useState(0)

  useEffect(() => {
    function handleViewportChange() {
      setViewportVersion((value) => value + 1)
    }

    globalThis.addEventListener('resize', handleViewportChange)
    globalThis.addEventListener('scroll', handleViewportChange, true)
    return () => {
      globalThis.removeEventListener('resize', handleViewportChange)
      globalThis.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [])
}

export function usePopoverTrailDismiss(
  containerRef: React.RefObject<HTMLDivElement | null>,
  onCloseTop: () => void,
) {
  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onCloseTop()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseTop()
      }
    }

    globalThis.addEventListener('mousedown', handleMouseDown)
    globalThis.addEventListener('keydown', handleEscape)
    return () => {
      globalThis.removeEventListener('mousedown', handleMouseDown)
      globalThis.removeEventListener('keydown', handleEscape)
    }
  }, [containerRef, onCloseTop])
}
