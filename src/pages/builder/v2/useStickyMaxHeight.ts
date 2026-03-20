import {useEffect, useRef, useState} from 'react'

const MIN_HEIGHT = 320
const DEFAULT_BOTTOM_PAD = 16
const DEFAULT_STICKY_TOP = 16

export function resolveStickyAvailableHeight({
  bottomPad = DEFAULT_BOTTOM_PAD,
  rectTop,
  stickyTop = DEFAULT_STICKY_TOP,
  viewportHeight,
}: {
  bottomPad?: number
  rectTop: number
  stickyTop?: number
  viewportHeight: number
}) {
  const clampedTop = Math.max(rectTop, stickyTop)
  return Math.max(MIN_HEIGHT, Math.round(viewportHeight - clampedTop - bottomPad))
}

export function useStickyMaxHeight(bottomPad = DEFAULT_BOTTOM_PAD, stickyTop = DEFAULT_STICKY_TOP) {
  const ref = useRef<HTMLDivElement>(null)
  const [maxHeight, setMaxHeight] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const element = el
    let rafId = 0

    function measure() {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const rect = element.getBoundingClientRect()
        setMaxHeight(
          resolveStickyAvailableHeight({
            bottomPad,
            rectTop: rect.top,
            stickyTop,
            viewportHeight: window.innerHeight,
          }),
        )
      })
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(element)
    ro.observe(document.documentElement)
    window.addEventListener('resize', measure, {passive: true})
    window.addEventListener('scroll', measure, {passive: true})
    window.visualViewport?.addEventListener('resize', measure, {passive: true})

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
      window.visualViewport?.removeEventListener('resize', measure)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [bottomPad, stickyTop])

  return {ref, maxHeight}
}
