import {useEffect, useLayoutEffect, useRef, useState, type RefObject} from 'react'

import {resolveBuilderPageSnapTarget} from './builder-page-snap'
import {resolveBuilderViewTransitionScrollDelta} from './builder-view-transition'

function createResizeMeasurementCleanup(measure: () => void, getFrameId: () => number) {
  return () => {
    window.removeEventListener('resize', measure)
    const frameId = getFrameId()
    if (frameId) {
      cancelAnimationFrame(frameId)
    }
  }
}

function useElementSize({subtractPadding = false}: {subtractPadding?: boolean} = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({height: 0, width: 0})

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const element = ref.current
    if (!element) {
      return
    }

    let frameId = 0

    const measure = () => {
      if (frameId) {
        return
      }

      frameId = requestAnimationFrame(() => {
        frameId = 0

        const bounds = element.getBoundingClientRect()
        const paddingOffset = subtractPadding
          ? (() => {
              const styles = window.getComputedStyle(element)
              return {
                height:
                  (Number.parseFloat(styles.paddingTop) || 0) +
                  (Number.parseFloat(styles.paddingBottom) || 0),
                width:
                  (Number.parseFloat(styles.paddingLeft) || 0) +
                  (Number.parseFloat(styles.paddingRight) || 0),
              }
            })()
          : {height: 0, width: 0}
        const nextSize = {
          height: Math.round(Math.max(0, bounds.height - paddingOffset.height)),
          width: Math.round(Math.max(0, bounds.width - paddingOffset.width)),
        }

        if (nextSize.height > 0 || nextSize.width > 0) {
          setSize(nextSize)
        }
      })
    }

    const cleanup = createResizeMeasurementCleanup(measure, () => frameId)

    measure()
    window.addEventListener('resize', measure)

    if (!('ResizeObserver' in window)) {
      return cleanup
    }

    const observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
      cleanup()
    }
  }, [subtractPadding])

  return {...size, ref}
}

export function useMeasuredElementSize() {
  return useElementSize()
}

export function useMeasuredElementRect() {
  const ref = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState({height: 0, top: 0, width: 0})

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const element = ref.current
    if (!element) {
      return
    }

    let frameId = 0

    const measure = () => {
      if (frameId) {
        return
      }

      frameId = requestAnimationFrame(() => {
        frameId = 0

        const bounds = element.getBoundingClientRect()
        const nextRect = {
          height: Math.round(Math.max(0, bounds.height)),
          top: Math.round(bounds.top),
          width: Math.round(Math.max(0, bounds.width)),
        }

        setRect((current) =>
          current.height === nextRect.height &&
          current.top === nextRect.top &&
          current.width === nextRect.width
            ? current
            : nextRect,
        )
      })
    }

    const cleanup = createResizeMeasurementCleanup(measure, () => frameId)
    const visualViewport = window.visualViewport

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, {passive: true})
    visualViewport?.addEventListener('resize', measure)
    visualViewport?.addEventListener('scroll', measure)

    if (!('ResizeObserver' in window)) {
      return () => {
        window.removeEventListener('scroll', measure)
        visualViewport?.removeEventListener('resize', measure)
        visualViewport?.removeEventListener('scroll', measure)
        cleanup()
      }
    }

    const observer = new ResizeObserver(() => {
      measure()
    })
    observer.observe(element)

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', measure)
      visualViewport?.removeEventListener('resize', measure)
      visualViewport?.removeEventListener('scroll', measure)
      cleanup()
    }
  }, [])

  return {...rect, ref}
}

export function useMeasuredElementInnerHeight() {
  const {height, ref} = useElementSize({subtractPadding: true})
  return {height, ref}
}

function getViewportSize() {
  if (typeof window === 'undefined') {
    return {height: 0, width: 0}
  }

  const visualViewport = window.visualViewport

  return {
    height: Math.round(visualViewport?.height ?? window.innerHeight),
    width: Math.round(visualViewport?.width ?? window.innerWidth),
  }
}

export function useViewportSize() {
  const [size, setSize] = useState(getViewportSize)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    let frameId = 0

    const measure = () => {
      if (frameId) {
        return
      }

      frameId = requestAnimationFrame(() => {
        frameId = 0

        setSize((current) => {
          const next = getViewportSize()
          if (current.width === next.width && current.height === next.height) {
            return current
          }

          return next
        })
      })
    }

    const visualViewport = window.visualViewport

    measure()
    window.addEventListener('resize', measure)
    visualViewport?.addEventListener('resize', measure)

    return () => {
      window.removeEventListener('resize', measure)
      visualViewport?.removeEventListener('resize', measure)
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [])

  return size
}

const MOBILE_BUILDER_SNAP_ATTRIBUTE = 'data-mobile-builder-snap'
const MOBILE_BUILDER_SNAP_TARGET_SELECTOR = '[data-mobile-builder-snap-target="true"]'
const MOBILE_BUILDER_EXIT_SELECTOR = '[data-mobile-builder-exit-zone="true"]'
const MOBILE_PAGE_SNAP_ARM_DELAY_MS = 240
const MOBILE_PAGE_SNAP_SETTLE_DELAY_MS = 120
const MOBILE_PAGE_SNAP_RELEASE_DELAY_MS = 220

function getMobileBuilderSnapTarget(targetRef: RefObject<HTMLElement | null>) {
  return (
    targetRef.current?.querySelector<HTMLElement>(MOBILE_BUILDER_SNAP_TARGET_SELECTOR) ??
    targetRef.current
  )
}

export function useBuilderPageSnapDocument(enabled: boolean) {
  useEffect(() => {
    if (typeof document === 'undefined' || !enabled) {
      return
    }

    document.documentElement.setAttribute(MOBILE_BUILDER_SNAP_ATTRIBUTE, 'enabled')
    document.body.setAttribute(MOBILE_BUILDER_SNAP_ATTRIBUTE, 'enabled')

    return () => {
      document.documentElement.removeAttribute(MOBILE_BUILDER_SNAP_ATTRIBUTE)
      document.body.removeAttribute(MOBILE_BUILDER_SNAP_ATTRIBUTE)
    }
  }, [enabled])
}

export function useRecenterMobileBuilderZone(
  activeKey: string,
  enabled: boolean,
  targetRef: RefObject<HTMLElement | null>,
) {
  const hasInitializedRef = useRef(false)
  const previousActiveKeyRef = useRef(activeKey)

  useEffect(() => {
    if (!enabled) {
      hasInitializedRef.current = false
      previousActiveKeyRef.current = activeKey
      return
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      previousActiveKeyRef.current = activeKey
      return
    }

    if (previousActiveKeyRef.current === activeKey) {
      return
    }

    previousActiveKeyRef.current = activeKey
    const snapTarget = getMobileBuilderSnapTarget(targetRef)

    if (typeof snapTarget?.scrollIntoView !== 'function') {
      return
    }

    if (Math.abs(snapTarget.getBoundingClientRect().top) <= 1) {
      return
    }

    snapTarget.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    })
  }, [activeKey, enabled, targetRef])
}

export function usePreserveMobileBuilderViewportOnViewChange(
  activeKey: string,
  enabled: boolean,
  targetRef: RefObject<HTMLElement | null>,
) {
  const previousActiveKeyRef = useRef(activeKey)
  const previousTargetTopRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const snapTarget = getMobileBuilderSnapTarget(targetRef)
    const scrollingElement =
      typeof document === 'undefined' ? null : (document.scrollingElement as HTMLElement | null)

    if (!enabled || !snapTarget || !scrollingElement) {
      previousActiveKeyRef.current = activeKey
      previousTargetTopRef.current = snapTarget?.getBoundingClientRect().top ?? null
      return
    }

    const nextTargetTop = snapTarget.getBoundingClientRect().top
    const activeKeyChanged = previousActiveKeyRef.current !== activeKey

    if (activeKeyChanged) {
      const scrollDelta = resolveBuilderViewTransitionScrollDelta({
        nextTargetTop,
        previousTargetTop: previousTargetTopRef.current,
      })

      if (scrollDelta !== null) {
        scrollingElement.scrollTop += scrollDelta
      }
    }

    previousActiveKeyRef.current = activeKey
    previousTargetTopRef.current = snapTarget.getBoundingClientRect().top
  }, [activeKey, enabled, targetRef])
}

export function useStickyBuilderPageSnap(
  enabled: boolean,
  targetRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || !enabled) {
      return
    }

    const scrollingElement = document.scrollingElement

    if (!scrollingElement) {
      return
    }

    let settleTimeout = 0
    let releaseTimeout = 0
    let armTimeout = 0
    let isArmed = false
    let isSnapping = false
    let lastScrollTop = scrollingElement.scrollTop

    const clearTimers = () => {
      if (settleTimeout) {
        window.clearTimeout(settleTimeout)
        settleTimeout = 0
      }

      if (releaseTimeout) {
        window.clearTimeout(releaseTimeout)
        releaseTimeout = 0
      }

      if (armTimeout) {
        window.clearTimeout(armTimeout)
        armTimeout = 0
      }
    }

    armTimeout = window.setTimeout(() => {
      isArmed = true
      lastScrollTop = scrollingElement.scrollTop
      armTimeout = 0
    }, MOBILE_PAGE_SNAP_ARM_DELAY_MS)

    const handleScrollSettled = () => {
      if (isSnapping) {
        return
      }

      const builderTarget = getMobileBuilderSnapTarget(targetRef)
      const exitTarget = document.querySelector<HTMLElement>(MOBILE_BUILDER_EXIT_SELECTOR)

      if (!builderTarget) {
        lastScrollTop = scrollingElement.scrollTop
        return
      }

      const currentScrollTop = scrollingElement.scrollTop
      const targetKind = resolveBuilderPageSnapTarget({
        builderTop: builderTarget.getBoundingClientRect().top,
        currentScrollTop,
        exitTop: exitTarget?.getBoundingClientRect().top ?? null,
        lastScrollTop,
        viewportHeight: window.innerHeight,
      })

      lastScrollTop = currentScrollTop

      const snapTarget =
        targetKind === 'builder' ? builderTarget : targetKind === 'exit' ? exitTarget : null

      if (!snapTarget || Math.abs(snapTarget.getBoundingClientRect().top) <= 1) {
        return
      }

      isSnapping = true
      snapTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest',
      })

      releaseTimeout = window.setTimeout(() => {
        isSnapping = false
        lastScrollTop = scrollingElement.scrollTop
      }, MOBILE_PAGE_SNAP_RELEASE_DELAY_MS)
    }

    const handleScroll = () => {
      if (isSnapping) {
        return
      }

      if (!isArmed) {
        lastScrollTop = scrollingElement.scrollTop
        return
      }

      if (settleTimeout) {
        window.clearTimeout(settleTimeout)
      }

      settleTimeout = window.setTimeout(handleScrollSettled, MOBILE_PAGE_SNAP_SETTLE_DELAY_MS)
    }

    window.addEventListener('scroll', handleScroll, {passive: true})

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimers()
    }
  }, [enabled, targetRef])
}
