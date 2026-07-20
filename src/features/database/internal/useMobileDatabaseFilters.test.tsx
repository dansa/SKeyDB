import {act, renderHook} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useMobileDatabaseFilters} from './useMobileDatabaseFilters'

const originalMatchMedia = window.matchMedia

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  })
})

describe('useMobileDatabaseFilters', () => {
  it('tracks the mobile filter media query and cleans up the listener', () => {
    const mediaQuery = installMockMatchMedia(false)
    const {result, unmount} = renderHook(() => useMobileDatabaseFilters())

    expect(result.current).toBe(false)

    act(() => {
      mediaQuery.setMatches(true)
    })
    expect(result.current).toBe(true)

    act(() => {
      mediaQuery.setMatches(false)
    })
    expect(result.current).toBe(false)

    unmount()
    expect(mediaQuery.listenerCount()).toBe(0)
  })
})

function installMockMatchMedia(matches: boolean) {
  const mediaQuery = createMockMediaQueryList(matches)

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => mediaQuery),
  })

  return mediaQuery
}

function createMockMediaQueryList(initialMatches: boolean) {
  const listeners = new Set<MockMediaQueryListener>()
  const addMockListener = (listener: MockMediaQueryListener | null) => {
    if (listener !== null) {
      listeners.add(listener)
    }
  }
  const removeMockListener = (listener: MockMediaQueryListener | null) => {
    if (listener !== null) {
      listeners.delete(listener)
    }
  }
  const addEventListener: MediaQueryList['addEventListener'] = (
    _type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    addMockListener(listener)
  }
  const addListener: MediaQueryList['addListener'] = (listener) => {
    addMockListener(listener)
  }
  const removeEventListener: MediaQueryList['removeEventListener'] = (
    _type: string,
    listener: EventListenerOrEventListenerObject | null,
  ) => {
    removeMockListener(listener)
  }
  const removeListener: MediaQueryList['removeListener'] = (listener) => {
    removeMockListener(listener)
  }
  const mediaQuery: MutableMockMediaQueryList = {
    matches: initialMatches,
    media: '(max-width: 639.98px)',
    onchange: null,
    addEventListener,
    addListener,
    removeEventListener,
    removeListener,
    dispatchEvent: () => true,
    setMatches(nextMatches: boolean) {
      mediaQuery.matches = nextMatches
      const event = {matches: nextMatches, media: mediaQuery.media} as MediaQueryListEvent
      listeners.forEach((listener) => {
        if (typeof listener === 'function') {
          listener.call(mediaQuery, event)
          return
        }
        listener.handleEvent(event)
      })
    },
    listenerCount: () => listeners.size,
  }

  return mediaQuery
}

type MockMediaQueryListener =
  | EventListenerObject
  | ((this: MediaQueryList, ev: MediaQueryListEvent) => void)

interface MutableMockMediaQueryList extends MediaQueryList {
  matches: boolean
  media: string
  onchange: null
  addEventListener: MediaQueryList['addEventListener']
  addListener: MediaQueryList['addListener']
  removeEventListener: MediaQueryList['removeEventListener']
  removeListener: MediaQueryList['removeListener']
  dispatchEvent: () => boolean
  setMatches(nextMatches: boolean): void
  listenerCount(): number
}
