import {renderHook, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  clearDatabaseDetailRecordCacheForTests,
  preloadDatabaseDetailRecord,
  useDatabaseDetailRecord,
} from './useDatabaseDetailRouteRecord'

afterEach(() => {
  clearDatabaseDetailRecordCacheForTests()
})

describe('useDatabaseDetailRecord', () => {
  it('shares in-flight preloads with hook-driven detail transitions', async () => {
    let resolveRecord!: (record: {id: string; name: string}) => void
    const pendingRecord = new Promise<{id: string; name: string}>((resolve) => {
      resolveRecord = resolve
    })
    const loadRecord = vi.fn(() => pendingRecord)

    const preload = preloadDatabaseDetailRecord({id: 'wheel-0003', loadRecord})
    const {result} = renderHook(
      () =>
        useDatabaseDetailRecord({
          id: 'wheel-0003',
          loadRecord,
        }),
      {wrapper: MemoryRouter},
    )

    expect(result.current.isLoading).toBe(true)
    expect(loadRecord).toHaveBeenCalledTimes(1)

    resolveRecord({id: 'wheel-0003', name: 'Shared load'})
    await preload

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        record: {id: 'wheel-0003', name: 'Shared load'},
      })
    })
    expect(loadRecord).toHaveBeenCalledTimes(1)
  })

  it('uses a preloaded record immediately for matching ids', async () => {
    const loadRecord = vi.fn(async (id: string) => ({id, name: 'Preloaded'}))

    await preloadDatabaseDetailRecord({id: 'wheel-0001', loadRecord})

    const {result} = renderHook(
      () =>
        useDatabaseDetailRecord({
          id: 'wheel-0001',
          loadRecord,
        }),
      {wrapper: MemoryRouter},
    )

    expect(result.current).toEqual({
      isLoading: false,
      record: {id: 'wheel-0001', name: 'Preloaded'},
    })
    expect(loadRecord).toHaveBeenCalledTimes(1)
  })

  it('caches records loaded through the hook for later detail transitions', async () => {
    const loadRecord = vi.fn(async (id: string) => ({id, name: 'Loaded'}))

    const {result, unmount} = renderHook(
      () =>
        useDatabaseDetailRecord({
          id: 'wheel-0002',
          loadRecord,
        }),
      {wrapper: MemoryRouter},
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    unmount()

    const second = renderHook(
      () =>
        useDatabaseDetailRecord({
          id: 'wheel-0002',
          loadRecord,
        }),
      {wrapper: MemoryRouter},
    )

    expect(second.result.current).toEqual({
      isLoading: false,
      record: {id: 'wheel-0002', name: 'Loaded'},
    })
    expect(loadRecord).toHaveBeenCalledTimes(1)
  })

  it('loads a new id when the current detail route changes', async () => {
    const loadRecord = vi.fn(async (id: string) => ({id, name: id}))

    const {rerender, result} = renderHook(
      ({id}) =>
        useDatabaseDetailRecord({
          id,
          loadRecord,
        }),
      {initialProps: {id: 'awakener-0001'}, wrapper: MemoryRouter},
    )

    await waitFor(() => {
      expect(result.current.record).toEqual({id: 'awakener-0001', name: 'awakener-0001'})
    })

    rerender({id: 'awakener-0002'})

    await waitFor(() => {
      expect(result.current.record).toEqual({id: 'awakener-0002', name: 'awakener-0002'})
    })
    expect(loadRecord).toHaveBeenCalledWith('awakener-0002')
  })
})
