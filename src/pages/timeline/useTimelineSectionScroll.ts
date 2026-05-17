import {useEffect} from 'react'

import type {TimelineSectionId} from '@/domain/timeline-routing'

export function useTimelineSectionScroll(timelineSection: TimelineSectionId | undefined) {
  useEffect(() => {
    if (!timelineSection) return

    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(timelineSection)?.scrollIntoView({
        block: 'start',
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [timelineSection])
}
