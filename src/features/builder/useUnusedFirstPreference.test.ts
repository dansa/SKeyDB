import {act, renderHook} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {useUnusedFirstPreference} from './useUnusedFirstPreference'

describe('unused-first preference', () => {
  it('defaults off and persists for the next builder mount', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
      removeItem: (key: string) => {
        values.delete(key)
      },
    }
    const first = renderHook(() => useUnusedFirstPreference(storage))
    expect(first.result.current.unusedFirst).toBe(false)
    act(() => {
      first.result.current.setUnusedFirst(true)
    })
    expect(values.get('skeydb.builder.unusedFirst.v1')).toBe('1')
    first.unmount()
    const next = renderHook(() => useUnusedFirstPreference(storage))
    expect(next.result.current.unusedFirst).toBe(true)
  })
})
