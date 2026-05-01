import {describe, expect, it} from 'vitest'

import {loadWheelFullV1ById} from './wheels-full-v1-loader'

describe('wheels-full-v1-loader', () => {
  it('loads individual records from public V2 chunks by canonical id', async () => {
    await expect(loadWheelFullV1ById('wheel-0003')).resolves.toMatchObject({
      id: 'wheel-0003',
      name: "Winter's Requiem",
      mainstatSeriesKey: 'SSR:KEYFLARE_REGEN',
    })
  })

  it('returns undefined when no public V2 record exists for an id', async () => {
    await expect(loadWheelFullV1ById('NOPE')).resolves.toBeUndefined()
  })
})
