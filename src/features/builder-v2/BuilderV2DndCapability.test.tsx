import {act, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useBuilderV2DndEnabledForDevice} from './BuilderV2DndCapability'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })
})

describe('useBuilderV2DndEnabledForDevice', () => {
  it('updates when modern MediaQueryList change events fire', () => {
    const mediaQuery = installMockMatchMedia({matches: false, mode: 'modern'})
    const {result, unmount} = renderHook(() => useBuilderV2DndEnabledForDevice())

    expect(result.current).toBe(true)

    act(() => {
      mediaQuery.setMatches(true)
    })
    expect(result.current).toBe(false)

    act(() => {
      mediaQuery.setMatches(false)
    })
    expect(result.current).toBe(true)

    unmount()
    expect(mediaQuery.modernListenerCount()).toBe(0)
  })

  it('updates when legacy MediaQueryList addListener change events fire', () => {
    const mediaQuery = installMockMatchMedia({matches: true, mode: 'legacy'})
    const {result, unmount} = renderHook(() => useBuilderV2DndEnabledForDevice())

    expect(result.current).toBe(false)

    act(() => {
      mediaQuery.setMatches(false)
    })
    expect(result.current).toBe(true)

    act(() => {
      mediaQuery.setMatches(true)
    })
    expect(result.current).toBe(false)

    unmount()
    expect(mediaQuery.legacyListenerCount()).toBe(0)
  })
})

type MockMediaQueryListMode = 'modern' | 'legacy'

function installMockMatchMedia({matches, mode}: {matches: boolean; mode: MockMediaQueryListMode}) {
  const mediaQuery = createMockMediaQueryList(matches, mode)

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => mediaQuery),
  })

  return mediaQuery
}

function createMockMediaQueryList(initialMatches: boolean, mode: MockMediaQueryListMode) {
  const modernListeners = new Set<EventListenerOrEventListenerObject>()
  const legacyListeners = new Set<(event: MediaQueryListEvent) => void>()
  const addModernEventListener = (
    _type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    if (listener) {
      modernListeners.add(listener)
    }
  }
  const removeModernEventListener = (
    _type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    if (listener) {
      modernListeners.delete(listener)
    }
  }

  const mediaQuery: MutableMockMediaQueryList = {
    matches: initialMatches,
    media: '(any-pointer: coarse), (pointer: coarse), (hover: none)',
    onchange: null,
    addEventListener:
      mode === 'modern'
        ? (addModernEventListener as MediaQueryList['addEventListener'])
        : undefined,
    removeEventListener:
      mode === 'modern'
        ? (removeModernEventListener as MediaQueryList['removeEventListener'])
        : undefined,
    addListener:
      mode === 'legacy'
        ? (listener: (event: MediaQueryListEvent) => void) => {
            legacyListeners.add(listener)
          }
        : undefined,
    removeListener:
      mode === 'legacy'
        ? (listener: (event: MediaQueryListEvent) => void) => {
            legacyListeners.delete(listener)
          }
        : undefined,
    dispatchEvent: () => true,
    setMatches(nextMatches: boolean) {
      mediaQuery.matches = nextMatches
      const event = {matches: nextMatches, media: mediaQuery.media} as MediaQueryListEvent
      modernListeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener(event)
          return
        }
        listener.handleEvent(event)
      })
      legacyListeners.forEach((listener) => {
        listener(event)
      })
    },
    modernListenerCount: () => modernListeners.size,
    legacyListenerCount: () => legacyListeners.size,
  }

  return mediaQuery as MediaQueryList & {
    setMatches(nextMatches: boolean): void
    modernListenerCount(): number
    legacyListenerCount(): number
  }
}

interface MutableMockMediaQueryList {
  matches: boolean
  media: string
  onchange: null
  addEventListener?: MediaQueryList['addEventListener']
  removeEventListener?: MediaQueryList['removeEventListener']
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
  dispatchEvent: () => boolean
  setMatches(nextMatches: boolean): void
  modernListenerCount(): number
  legacyListenerCount(): number
}
