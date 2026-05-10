import {useCallback, useEffect, useRef} from 'react'

import {POPOVER_TIMINGS} from './popover-config'

export function useHoverIntent(onOpen: (anchorElement: HTMLElement) => void) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const onMouseEnter = useCallback(
    (event: React.MouseEvent) => {
      const anchorElement = event.currentTarget
      if (!(anchorElement instanceof HTMLElement)) {
        return
      }

      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }

      timerRef.current = window.setTimeout(() => {
        onOpen(anchorElement)
        timerRef.current = null
      }, POPOVER_TIMINGS.HOVER_DELAY) as unknown as number
    },
    [onOpen],
  )

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  return {
    onMouseEnter,
    onMouseLeave,
  }
}
