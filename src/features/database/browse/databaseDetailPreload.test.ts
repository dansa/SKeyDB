import {beforeEach, describe, expect, it, vi} from 'vitest'

const {hostModuleLoaded, preloadRegisteredDetailRecord, preloadRegisteredDetailShell} = vi.hoisted(
  () => ({
    hostModuleLoaded: vi.fn(),
    preloadRegisteredDetailRecord: vi.fn(),
    preloadRegisteredDetailShell: vi.fn(),
  }),
)

vi.mock('../detail/DbDetailModalHost', () => {
  hostModuleLoaded()
  return {DbDetailModalHost: () => null}
})

vi.mock('../detail/dbDetailRegistry', () => ({
  preloadDatabaseDetailRecordByKind: preloadRegisteredDetailRecord,
  preloadDatabaseDetailShell: preloadRegisteredDetailShell,
}))

beforeEach(() => {
  vi.resetModules()
  hostModuleLoaded.mockClear()
  preloadRegisteredDetailRecord.mockClear()
  preloadRegisteredDetailShell.mockClear()
})

describe('database detail intent preloading', () => {
  it('separates shell warming from committed record-fetch intent', async () => {
    const {preloadDatabaseDetail, preloadDatabaseDetailShell} =
      await import('./databaseDetailPreload')

    preloadDatabaseDetailShell('wheel')

    await vi.waitFor(() => {
      expect(hostModuleLoaded).toHaveBeenCalledOnce()
      expect(preloadRegisteredDetailShell).toHaveBeenCalledWith('wheel')
    })
    expect(preloadRegisteredDetailRecord).not.toHaveBeenCalled()

    preloadDatabaseDetail('wheel', 'wheel-test')

    await vi.waitFor(() => {
      expect(preloadRegisteredDetailRecord).toHaveBeenCalledWith('wheel', 'wheel-test')
    })
  })
})
