import {beforeEach, describe, expect, it, vi} from 'vitest'

const {hostModuleLoaded, preloadRegisteredDetail} = vi.hoisted(() => ({
  hostModuleLoaded: vi.fn(),
  preloadRegisteredDetail: vi.fn(),
}))

vi.mock('../detail/DbDetailModalHost', () => {
  hostModuleLoaded()
  return {DbDetailModalHost: () => null}
})

vi.mock('../detail/dbDetailRegistry', () => ({
  preloadDatabaseDetail: preloadRegisteredDetail,
}))

beforeEach(() => {
  vi.resetModules()
  hostModuleLoaded.mockClear()
  preloadRegisteredDetail.mockClear()
})

describe('database detail intent preloading', () => {
  it('preloads both the deferred host and selected detail path', async () => {
    const {preloadDatabaseDetail} = await import('./databaseDetailPreload')

    preloadDatabaseDetail('wheel', 'wheel-test')

    await vi.waitFor(() => {
      expect(hostModuleLoaded).toHaveBeenCalledOnce()
      expect(preloadRegisteredDetail).toHaveBeenCalledWith('wheel', 'wheel-test')
    })
  })
})
