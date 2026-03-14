import {useEffect, useRef, useState} from 'react'

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

    const cleanup = () => {
      window.removeEventListener('resize', measure)
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }

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

export function useMeasuredElementInnerHeight() {
  const {height, ref} = useElementSize({subtractPadding: true})
  return {height, ref}
}
