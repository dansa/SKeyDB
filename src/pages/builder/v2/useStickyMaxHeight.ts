import {useEffect, useRef, useState} from 'react'

const MIN_HEIGHT = 320
const DEFAULT_BOTTOM_PAD = 16

export function useStickyMaxHeight(bottomPad = DEFAULT_BOTTOM_PAD) {
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
        const available = window.innerHeight - rect.top - bottomPad
        setMaxHeight(Math.max(MIN_HEIGHT, Math.round(available)))
      })
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(document.documentElement)
    window.addEventListener('scroll', measure, {passive: true})

    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', measure)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [bottomPad])

  return {ref, maxHeight}
}
