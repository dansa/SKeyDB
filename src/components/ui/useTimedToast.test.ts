import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTimedToast } from './useTimedToast'

describe('useTimedToast', () => {
  it('stacks toasts and expires each one by its own timer', () => {
    vi.useFakeTimers()
    try {
      const { result } = renderHook(() => useTimedToast({ defaultDurationMs: 1000 }))

      act(() => {
        result.current.showToast('first')
      })
      expect(result.current.toastMessages).toEqual(['first'])
      expect(result.current.toastEntries).toEqual([{ id: 0, message: 'first' }])

      act(() => {
        vi.advanceTimersByTime(200)
        result.current.showToast('second')
      })
      expect(result.current.toastMessages).toEqual(['first', 'second'])
      expect(result.current.toastEntries).toEqual([
        { id: 0, message: 'first' },
        { id: 1, message: 'second' },
      ])

      act(() => {
        vi.advanceTimersByTime(801)
      })
      expect(result.current.toastMessages).toEqual(['second'])
      expect(result.current.toastEntries).toEqual([{ id: 1, message: 'second' }])

      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current.toastMessages).toEqual([])
      expect(result.current.toastEntries).toEqual([])
    } finally {
      vi.useRealTimers()
    }
  })
})
