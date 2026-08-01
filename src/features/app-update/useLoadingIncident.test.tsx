import {act, renderHook, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {useLoadingIncident} from './useLoadingIncident'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('useLoadingIncident', () => {
  it('lets Vite preload failures reach the lazy route boundary', () => {
    const {result} = renderHook(() => useLoadingIncident({pathname: '/database'}))
    const event = dispatchPreloadError(
      new TypeError('Failed to fetch dynamically imported module: /assets/shared.js'),
    )

    expect(event.defaultPrevented).toBe(false)
    expect(result.current.incident?.source).toBe('vite-preload')
  })

  it('checks the current version after a failed asset probe', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('export {}', {
          headers: {'content-type': 'application/javascript'},
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({buildId: 'dev'}), {
          headers: {'content-type': 'application/json'},
          status: 200,
        }),
      )
    vi.stubGlobal('fetch', request)

    renderHook(() => useLoadingIncident({pathname: '/database'}))
    dispatchPreloadError(
      new TypeError('Failed to fetch dynamically imported module: /assets/shared.js'),
    )

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2)
    })
    expect(request.mock.calls[1]?.[0]).toContain('/version.json')
  })

  it('checks the current version for a known module failure without a probeable URL', async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({buildId: 'dev'}), {
        headers: {'content-type': 'application/json'},
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', request)

    const {result} = renderHook(() => useLoadingIncident({pathname: '/database'}))
    act(() => {
      result.current.reportLoadingError(
        new TypeError('Importing a module script failed'),
        'react-boundary',
      )
    })

    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1)
    })
    expect(request.mock.calls[0]?.[0]).toContain('/version.json')
  })

  it('does not attach an earlier same-path probe to a replacement incident', async () => {
    const firstProbe = deferred<Response>()
    const secondProbe = deferred<Response>()
    const request = vi
      .fn()
      .mockImplementationOnce(async () => await firstProbe.promise)
      .mockImplementationOnce(async () => await secondProbe.promise)
      .mockResolvedValue(new Response(JSON.stringify({buildId: 'dev'}), {status: 200}))
    vi.stubGlobal('fetch', request)

    const {result} = renderHook(() => useLoadingIncident({pathname: '/database'}))
    dispatchPreloadError(
      new TypeError('Failed to fetch dynamically imported module: /assets/shared.js first'),
    )
    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(1)
    })
    const firstIncidentId = result.current.incident?.incidentId

    dispatchPreloadError(
      new TypeError('Failed to fetch dynamically imported module: /assets/shared.js second'),
    )
    await waitFor(() => {
      expect(request).toHaveBeenCalledTimes(2)
    })
    expect(result.current.incident?.incidentId).not.toBe(firstIncidentId)

    await act(async () => {
      firstProbe.resolve(
        new Response('<!doctype html>', {headers: {'content-type': 'text/html'}, status: 200}),
      )
      await firstProbe.promise
    })
    expect(result.current.incident?.assetProbe).toBeUndefined()

    await act(async () => {
      secondProbe.resolve(
        new Response('export {}', {
          headers: {'content-type': 'application/javascript'},
          status: 200,
        }),
      )
      await secondProbe.promise
    })
    await waitFor(() => {
      expect(result.current.incident?.assetProbe?.outcome).toBe('javascript-response')
    })
  })
})

function dispatchPreloadError(error: Error): Event {
  const event = new Event('vite:preloadError', {cancelable: true})
  Object.defineProperty(event, 'payload', {value: error})
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return {promise, resolve}
}
