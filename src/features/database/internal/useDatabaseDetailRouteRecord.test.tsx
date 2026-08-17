import {act, renderHook, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router'
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
      expect(result.current).toMatchObject({
        isLoading: false,
        record: {id: 'wheel-0003', name: 'Shared load'},
      })
    })
    expect(loadRecord).toHaveBeenCalledTimes(1)
  })

  it('publishes a preload that resolves between render and subscription', async () => {
    let resolveRecord!: (record: {id: string}) => void
    let settleChained!: () => void
    const chained = new Promise<{id: string}>((resolve) => {
      settleChained = () => {
        resolve({id: 'wheel-0007'})
      }
    })
    const source = {
      then: (onFulfilled: (record: {id: string}) => {id: string}) => {
        resolveRecord = (record) => {
          onFulfilled(record)
          settleChained()
        }
        return chained
      },
    } as Promise<{id: string}>
    const loadRecord = vi.fn(() => source)
    const preload = preloadDatabaseDetailRecord({id: 'wheel-0007', loadRecord})
    let shouldResolveDuringRender = true

    const {result} = renderHook(() => {
      const state = useDatabaseDetailRecord({id: 'wheel-0007', loadRecord})
      if (shouldResolveDuringRender) {
        shouldResolveDuringRender = false
        resolveRecord({id: 'wheel-0007'})
      }
      return state
    })

    await preload
    await waitFor(() => {
      expect(result.current).toMatchObject({
        isLoading: false,
        record: {id: 'wheel-0007'},
      })
    })
    expect(loadRecord).toHaveBeenCalledOnce()
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

    expect(result.current).toMatchObject({
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

    expect(second.result.current).toMatchObject({
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

  it('exposes rejected loads and retries them without retaining the failed promise', async () => {
    const loadError = new Error('controlled load failure')
    const loadRecord = vi
      .fn<(id: string) => Promise<{id: string; name: string}>>()
      .mockRejectedValueOnce(loadError)
      .mockResolvedValueOnce({id: 'wheel-0004', name: 'Recovered'})

    const {result} = renderHook(
      () =>
        useDatabaseDetailRecord({
          id: 'wheel-0004',
          loadRecord,
        }),
      {wrapper: MemoryRouter},
    )

    await waitFor(() => {
      expect(result.current.error).toBe(loadError)
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.record).toBeNull()

    act(() => {
      result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.record).toEqual({id: 'wheel-0004', name: 'Recovered'})
    })
    expect(result.current.error).toBeNull()
    expect(loadRecord).toHaveBeenCalledTimes(2)
  })

  it('does not publish a stale rejection after the selected id changes', async () => {
    let rejectFirst!: (error: Error) => void
    const firstRecord = new Promise<{id: string; name: string}>((_resolve, reject) => {
      rejectFirst = reject
    })
    const loadRecord = vi.fn((id: string) =>
      id === 'wheel-0005'
        ? firstRecord
        : Promise.resolve({id: 'wheel-0006', name: 'Current record'}),
    )
    const {rerender, result} = renderHook(({id}) => useDatabaseDetailRecord({id, loadRecord}), {
      initialProps: {id: 'wheel-0005'},
      wrapper: MemoryRouter,
    })

    rerender({id: 'wheel-0006'})
    await waitFor(() => {
      expect(result.current.record).toEqual({id: 'wheel-0006', name: 'Current record'})
    })

    rejectFirst(new Error('stale load failure'))
    await act(async () => {
      await firstRecord.catch(() => undefined)
    })

    expect(result.current).toMatchObject({
      error: null,
      isLoading: false,
      record: {id: 'wheel-0006', name: 'Current record'},
    })
  })
})
