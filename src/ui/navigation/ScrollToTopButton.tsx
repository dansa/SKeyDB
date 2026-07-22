import {useCallback, useEffect, useState} from 'react'

import {FaArrowUp} from 'react-icons/fa6'

const MINIMUM_TRIGGER_DISTANCE = 480
const MAXIMUM_VIEWPORT_FRACTION = 0.8
const SCROLL_PROGRESS_TRIGGER = 0.15

interface ScrollToTopButtonProps {
  routeKey: string
}

function scrollToTop() {
  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  window.scrollTo({behavior: reducedMotion ? 'auto' : 'smooth', top: 0})
}

export function ScrollToTopButton({routeKey}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false)

  const updateVisibility = useCallback(() => {
    const viewportHeight = window.innerHeight
    const maximumScroll = Math.max(0, document.documentElement.scrollHeight - viewportHeight)
    const pageWarrantsShortcut = maximumScroll >= viewportHeight
    const triggerDistance = Math.max(
      MINIMUM_TRIGGER_DISTANCE,
      Math.min(maximumScroll * SCROLL_PROGRESS_TRIGGER, viewportHeight * MAXIMUM_VIEWPORT_FRACTION),
    )

    setVisible(pageWarrantsShortcut && window.scrollY >= triggerDistance)
  }, [])

  useEffect(() => {
    let animationFrame = 0
    const scheduleVisibilityUpdate = () => {
      if (animationFrame) return

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = 0
        updateVisibility()
      })
    }

    scheduleVisibilityUpdate()
    window.addEventListener('scroll', scheduleVisibilityUpdate, {passive: true})
    window.addEventListener('resize', scheduleVisibilityUpdate)

    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            scheduleVisibilityUpdate()
          })
    resizeObserver?.observe(document.documentElement)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', scheduleVisibilityUpdate)
      window.removeEventListener('resize', scheduleVisibilityUpdate)
      resizeObserver?.disconnect()
    }
  }, [routeKey, updateVisibility])

  return (
    <button
      aria-hidden={!visible}
      aria-label='Scroll to top'
      className={`scroll-to-top-button ${visible ? 'scroll-to-top-button--visible' : ''}`}
      onClick={scrollToTop}
      tabIndex={visible ? 0 : -1}
      type='button'
    >
      <FaArrowUp aria-hidden />
    </button>
  )
}
