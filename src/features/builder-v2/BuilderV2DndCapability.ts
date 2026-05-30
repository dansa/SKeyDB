import {createContext, use, useEffect, useState} from 'react'

const BUILDER_V2_TOUCH_DND_DISABLE_QUERY = '(any-pointer: coarse), (pointer: coarse), (hover: none)'

export const BuilderV2DndEnabledContext = createContext(true)

export function useBuilderV2DndEnabled() {
  return use(BuilderV2DndEnabledContext)
}

export function useBuilderV2DndEnabledForDevice() {
  const [isDndEnabled, setIsDndEnabled] = useState(() => getBuilderV2DndEnabledForDevice())

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(BUILDER_V2_TOUCH_DND_DISABLE_QUERY)
    const syncDndCapability = () => {
      setIsDndEnabled(!mediaQuery.matches)
    }

    syncDndCapability()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncDndCapability)
      return () => {
        mediaQuery.removeEventListener('change', syncDndCapability)
      }
    }

    const legacyMediaQuery = mediaQuery as LegacyMediaQueryList
    if (typeof legacyMediaQuery.addListener !== 'function') {
      return
    }

    legacyMediaQuery.addListener(syncDndCapability)
    return () => {
      legacyMediaQuery.removeListener?.(syncDndCapability)
    }
  }, [])

  return isDndEnabled
}

function getBuilderV2DndEnabledForDevice() {
  if (typeof window.matchMedia !== 'function') {
    return true
  }

  return !window.matchMedia(BUILDER_V2_TOUCH_DND_DISABLE_QUERY).matches
}

interface LegacyMediaQueryList {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}
