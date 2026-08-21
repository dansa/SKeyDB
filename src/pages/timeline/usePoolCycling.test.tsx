import {act, renderHook} from '@testing-library/react'
import {vi} from 'vitest'

import type {BannerPoolSlot} from '@/domain/timeline'

import {CYCLE_INTERVAL_MS, usePoolCycling} from './usePoolCycling'

type MatchMediaListener = (event: MediaQueryListEvent) => void

function poolSlot(names: string[]): BannerPoolSlot {
  return {
    pool: names.map((name) => ({name, kind: 'awakener'})),
  }
}

function installMatchMedia(matches = false) {
  const listeners = new Set<MatchMediaListener>()
  const mediaQuery = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((event: string, listener: MatchMediaListener) => {
      if (event === 'change') listeners.add(listener)
    }),
    removeEventListener: vi.fn((event: string, listener: MatchMediaListener) => {
      if (event === 'change') listeners.delete(listener)
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList
  const matchMedia = vi.fn(() => mediaQuery)
  const setMatches = (nextMatches: boolean) => {
    Object.defineProperty(mediaQuery, 'matches', {
      configurable: true,
      value: nextMatches,
    })
    const event = {matches: nextMatches, media: mediaQuery.media} as MediaQueryListEvent
    listeners.forEach((listener) => {
      listener(event)
    })
  }

  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: matchMedia,
  })

  return {matchMedia, mediaQuery, setMatches}
}

describe('usePoolCycling', () => {
  beforeEach(() => {
    installMatchMedia(false)
  })

  it('reconciles frames when pool slot length and order change while timers are active', () => {
    vi.useFakeTimers()

    const sharedPool = ['Arachne', 'Tulu', 'Kuma']
    const initialSlots = [
      poolSlot(sharedPool),
      poolSlot(['Eternal Weave', 'Stakes']),
      poolSlot(sharedPool),
    ]
    const nextSlots = [poolSlot(sharedPool), poolSlot(sharedPool)]

    const {result, rerender, unmount} = renderHook(({slots}) => usePoolCycling(slots), {
      initialProps: {slots: initialSlots},
    })

    try {
      expect(result.current).toHaveLength(3)

      act(() => {
        vi.advanceTimersByTime(CYCLE_INTERVAL_MS)
      })

      act(() => {
        rerender({slots: nextSlots})
      })

      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })

  it('clears the cycle and pending transition timers when unmounted', () => {
    vi.useFakeTimers()
    const slots = [poolSlot(['Arachne', 'Tulu'])]
    const {unmount} = renderHook(() => usePoolCycling(slots))

    try {
      act(() => {
        vi.advanceTimersByTime(CYCLE_INTERVAL_MS)
      })

      expect(vi.getTimerCount()).toBe(2)

      unmount()

      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not warn about render-phase updates when the pool signature changes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const sharedPool = ['Arachne', 'Tulu', 'Kuma']
    const initialSlots = [poolSlot(sharedPool), poolSlot(['Eternal Weave', 'Stakes'])]
    const nextSlots = [poolSlot(sharedPool), poolSlot(sharedPool)]

    const {rerender, unmount} = renderHook(({slots}) => usePoolCycling(slots), {
      initialProps: {slots: initialSlots},
    })

    try {
      act(() => {
        rerender({slots: nextSlots})
      })

      expect(consoleError).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot update a component'),
        expect.anything(),
      )
    } finally {
      unmount()
      consoleError.mockRestore()
    }
  })

  it('returns stable initial frames and skips timers while reduced motion is active', () => {
    installMatchMedia(true)
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const slots = [poolSlot(['Arachne', 'Tulu', 'Kuma']), poolSlot(['Arachne', 'Tulu', 'Kuma'])]

    const {result, unmount} = renderHook(() => usePoolCycling(slots))

    try {
      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])

      act(() => {
        vi.advanceTimersByTime(CYCLE_INTERVAL_MS * 3)
      })

      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])
      expect(setIntervalSpy).not.toHaveBeenCalled()
    } finally {
      unmount()
      setIntervalSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('avoids duplicate candidates across overlapping bucket pools', () => {
    installMatchMedia(true)
    const slots = [
      poolSlot(['Shared', 'Assault Two']),
      poolSlot(['Shared', 'Male Two']),
      poolSlot(['Shared', 'Female Two']),
    ]

    const {result} = renderHook(() => usePoolCycling(slots))
    const visibleNames = result.current.map(
      (frame, slotIdx) => slots[slotIdx].pool[frame.activeIdx].name,
    )

    expect(new Set(visibleNames).size).toBe(visibleNames.length)
  })

  it('returns stable initial frames and skips timers until cycling is enabled', () => {
    vi.useFakeTimers()
    const setIntervalSpy = vi.spyOn(window, 'setInterval')
    const slots = [poolSlot(['Arachne', 'Tulu', 'Kuma']), poolSlot(['Arachne', 'Tulu', 'Kuma'])]

    const {result, rerender, unmount} = renderHook(
      ({enabled}) => usePoolCycling(slots, {enabled}),
      {
        initialProps: {enabled: false},
      },
    )

    try {
      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])

      act(() => {
        vi.advanceTimersByTime(CYCLE_INTERVAL_MS * 3)
      })

      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])
      expect(setIntervalSpy).not.toHaveBeenCalled()

      act(() => {
        rerender({enabled: true})
      })

      expect(setIntervalSpy).toHaveBeenCalled()
    } finally {
      unmount()
      setIntervalSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it('keeps duplicated empty pools inert instead of producing invalid frame indices', () => {
    const emptySlots: BannerPoolSlot[] = [{pool: []}, {pool: []}]

    const {result} = renderHook(() => usePoolCycling(emptySlots))

    expect(result.current).toEqual([
      {activeIdx: 0, incomingIdx: -1, transitioning: false},
      {activeIdx: 0, incomingIdx: -1, transitioning: false},
    ])
  })

  it('stops cycling when reduced motion becomes active', () => {
    const {setMatches} = installMatchMedia(false)
    vi.useFakeTimers()
    const slots = [poolSlot(['Arachne', 'Tulu', 'Kuma']), poolSlot(['Arachne', 'Tulu', 'Kuma'])]

    const {result, unmount} = renderHook(() => usePoolCycling(slots))

    try {
      act(() => {
        setMatches(true)
      })

      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])

      act(() => {
        vi.advanceTimersByTime(CYCLE_INTERVAL_MS * 3)
      })

      expect(result.current).toEqual([
        {activeIdx: 0, incomingIdx: -1, transitioning: false},
        {activeIdx: 1, incomingIdx: -1, transitioning: false},
      ])
    } finally {
      unmount()
      vi.useRealTimers()
    }
  })
})
