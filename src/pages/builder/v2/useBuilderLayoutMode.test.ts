import {act, renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {_detectLayoutMode as detectLayoutMode, useBuilderLayoutMode} from './useBuilderLayoutMode'

function createMatchMediaMock(matches: boolean) {
  return {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }
}

beforeEach(() => {
  window.matchMedia = vi.fn((query: string) => {
    if (query.includes('min-width: 1024px')) {
      return createMatchMediaMock(window.innerWidth >= 1024)
    }
    if (query.includes('min-width: 640px')) {
      return createMatchMediaMock(window.innerWidth >= 640 && window.innerWidth < 1024)
    }
    return createMatchMediaMock(false)
  }) as unknown as typeof window.matchMedia
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.removeItem('skeydb.builder.layoutOverride')
})

describe('detectLayoutMode', () => {
  it('returns desktop for width >= 1024', () => {
    expect(detectLayoutMode(1024)).toBe('desktop')
    expect(detectLayoutMode(1920)).toBe('desktop')
  })

  it('returns tablet for width 640-1023', () => {
    expect(detectLayoutMode(640)).toBe('tablet')
    expect(detectLayoutMode(1023)).toBe('tablet')
    expect(detectLayoutMode(768)).toBe('tablet')
  })

  it('returns mobile for width < 640', () => {
    expect(detectLayoutMode(639)).toBe('mobile')
    expect(detectLayoutMode(375)).toBe('mobile')
    expect(detectLayoutMode(0)).toBe('mobile')
  })
})

describe('useBuilderLayoutMode', () => {
  it('defaults to auto override and detects based on window width', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
    const {result} = renderHook(() => useBuilderLayoutMode())
    expect(result.current.layoutOverride).toBe('auto')
    expect(result.current.layoutMode).toBe('desktop')
    expect(result.current.detectedMode).toBe('desktop')
    vi.restoreAllMocks()
  })

  it('manual override takes precedence over detected mode', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
    const {result} = renderHook(() => useBuilderLayoutMode())
    act(() => {
      result.current.setLayoutOverride('mobile')
    })
    expect(result.current.layoutOverride).toBe('mobile')
    expect(result.current.layoutMode).toBe('mobile')
    expect(result.current.detectedMode).toBe('desktop')
    vi.restoreAllMocks()
  })

  it('setting override to auto reverts to detected mode', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(800)
    const {result} = renderHook(() => useBuilderLayoutMode())
    act(() => {
      result.current.setLayoutOverride('desktop')
    })
    expect(result.current.layoutMode).toBe('desktop')
    act(() => {
      result.current.setLayoutOverride('auto')
    })
    expect(result.current.layoutMode).toBe('tablet')
    vi.restoreAllMocks()
  })

  it('persists override to localStorage', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200)
    const {result} = renderHook(() => useBuilderLayoutMode())
    act(() => {
      result.current.setLayoutOverride('tablet')
    })
    const stored = window.localStorage.getItem('skeydb.builder.layoutOverride')
    expect(stored).toBe('tablet')
    window.localStorage.removeItem('skeydb.builder.layoutOverride')
    vi.restoreAllMocks()
  })
})
