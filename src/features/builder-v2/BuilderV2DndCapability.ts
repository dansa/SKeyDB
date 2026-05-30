import {createContext, use, useSyncExternalStore} from 'react'

const BUILDER_V2_TOUCH_DND_DISABLE_QUERY = '(any-pointer: coarse), (pointer: coarse), (hover: none)'

export const BuilderV2DndEnabledContext = createContext(true)

export function useBuilderV2DndEnabled() {
  return use(BuilderV2DndEnabledContext)
}

export function useBuilderV2DndEnabledForDevice() {
  return useSyncExternalStore(
    subscribeToBuilderV2DndCapability,
    getBuilderV2DndEnabledForDevice,
    getServerBuilderV2DndEnabledForDevice,
  )
}

function subscribeToBuilderV2DndCapability(onStoreChange: () => void) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => undefined
  }

  const mediaQuery = window.matchMedia(BUILDER_V2_TOUCH_DND_DISABLE_QUERY)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onStoreChange)
    return () => {
      mediaQuery.removeEventListener('change', onStoreChange)
    }
  }

  const legacyMediaQuery = mediaQuery as LegacyMediaQueryList
  if (typeof legacyMediaQuery.addListener !== 'function') {
    return () => undefined
  }

  legacyMediaQuery.addListener(onStoreChange)
  return () => {
    legacyMediaQuery.removeListener?.(onStoreChange)
  }
}

function getBuilderV2DndEnabledForDevice() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return getServerBuilderV2DndEnabledForDevice()
  }

  return !window.matchMedia(BUILDER_V2_TOUCH_DND_DISABLE_QUERY).matches
}

function getServerBuilderV2DndEnabledForDevice() {
  return true
}

interface LegacyMediaQueryList {
  addListener?: (listener: () => void) => void
  removeListener?: (listener: () => void) => void
}
