import {describe, expect, it} from 'vitest'

import {
  getPublicV2Envelope,
  loadPublicV2Envelope,
  loadPublicV2FullRecord,
} from './public-v2-loaders'

describe('public-v2-loaders', () => {
  it('loads lite and full aggregate envelopes for supported scopes', async () => {
    const awakeners = await loadPublicV2Envelope('lite', 'awakeners')
    const wheels = await loadPublicV2Envelope('full', 'wheels')

    expect(awakeners.scope).toBe('awakeners')
    expect(awakeners.records.length).toBeGreaterThan(0)
    expect(awakeners.recordCount).toBe(awakeners.records.length)
    expect(wheels.scope).toBe('wheels')
    expect(wheels.records.length).toBeGreaterThan(0)
    expect(wheels.recordCount).toBe(wheels.records.length)
    expect(getPublicV2Envelope('full', 'wheels')).toBe(wheels)
  })

  it.each([
    ['awakeners', 'awakener-0001'],
    ['wheels', 'wheel-0001'],
    ['covenants', 'covenant-0001'],
    ['posses', 'posse-0022'],
    ['relics', 'relic-0001'],
    ['awakener-builds', 'awakener-build-0001'],
  ] as const)('loads known %s record chunks by canonical id', async (scope, recordId) => {
    await expect(loadPublicV2FullRecord(scope, recordId)).resolves.toMatchObject({id: recordId})
  })

  it('returns undefined for unknown record chunks', async () => {
    await expect(loadPublicV2FullRecord('awakeners', 'awakener-9999')).resolves.toBeUndefined()
  })
})
