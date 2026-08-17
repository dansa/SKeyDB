import {act, renderHook} from '@testing-library/react'
import type {NavigateFunction} from 'react-router'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useEntityBrowseController} from './useEntityBrowseController'

const {preloadDatabaseDetail, preloadDatabaseDetailShell} = vi.hoisted(() => ({
  preloadDatabaseDetail: vi.fn(),
  preloadDatabaseDetailShell: vi.fn(),
}))

vi.mock('./databaseDetailPreload', () => ({
  preloadDatabaseDetail,
  preloadDatabaseDetailShell,
}))

beforeEach(() => {
  preloadDatabaseDetail.mockClear()
  preloadDatabaseDetailShell.mockClear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useEntityBrowseController detail loading', () => {
  it('keeps untouched browse idle and preloads only on interaction intent', () => {
    const navigate = vi.fn() as unknown as NavigateFunction
    const {result, unmount} = renderHook(() =>
      useEntityBrowseController({
        activeEntity: 'wheels',
        browseOrigin: null,
        isDetailOpen: false,
        locationPathname: '/database/wheels',
        locationSearch: '',
        locationState: null,
        navigate,
        routeEntity: 'wheels',
      }),
    )

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(preloadDatabaseDetail).not.toHaveBeenCalled()

    act(() => {
      result.current.preloadDetail('wheel', 'wheel-test')
    })
    expect(preloadDatabaseDetail).toHaveBeenCalledWith('wheel', 'wheel-test')

    act(() => {
      result.current.warmDetailShell('wheel')
    })
    expect(preloadDatabaseDetailShell).toHaveBeenCalledWith('wheel')

    unmount()
  })
})
