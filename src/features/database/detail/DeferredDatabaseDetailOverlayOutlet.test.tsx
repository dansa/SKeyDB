import {act, render, waitFor} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createDatabaseDetailOverlaySession} from '@/stores/dbDetailStore'

const {heavyOutletLoaded, heavyOutletRendered} = vi.hoisted(() => ({
  heavyOutletLoaded: vi.fn(),
  heavyOutletRendered: vi.fn(),
}))

vi.mock('./DbDetailModalHost', () => {
  heavyOutletLoaded()
  return {
    DatabaseDetailOverlayOutlet: () => {
      heavyOutletRendered()
      return null
    },
  }
})

describe('DeferredDatabaseDetailOverlayOutlet', () => {
  it('can prewarm the heavy detail host without mounting it before its session opens', async () => {
    const {DeferredDatabaseDetailOverlayOutlet} =
      await import('./DeferredDatabaseDetailOverlayOutlet')
    const {preloadDatabaseDetailOverlayOutlet} = await import('./databaseDetailOverlayLoader')
    const session = createDatabaseDetailOverlaySession()
    render(<DeferredDatabaseDetailOverlayOutlet session={session} />)

    await act(async () => undefined)
    expect(heavyOutletLoaded).not.toHaveBeenCalled()

    await preloadDatabaseDetailOverlayOutlet()
    expect(heavyOutletLoaded).toHaveBeenCalledOnce()
    expect(heavyOutletRendered).not.toHaveBeenCalled()

    act(() => {
      session.open({kind: 'awakener', id: 'awakener-0001'})
    })

    await waitFor(() => {
      expect(heavyOutletLoaded).toHaveBeenCalledOnce()
      expect(heavyOutletRendered).toHaveBeenCalled()
    })
  })
})
