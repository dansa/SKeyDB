import {describe, expect, it, vi} from 'vitest'

import {getOrCreateRetryableMapPromise} from './cache'

describe('getOrCreateRetryableMapPromise', () => {
  it('shares pending work but evicts a rejected promise so the next call can retry', async () => {
    const cache = new Map<string, Promise<string>>()
    const createValue = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('controlled repository failure'))
      .mockResolvedValueOnce('recovered')

    const first = getOrCreateRetryableMapPromise(cache, 'record', createValue)
    expect(getOrCreateRetryableMapPromise(cache, 'record', createValue)).toBe(first)
    await expect(first).rejects.toThrow('controlled repository failure')

    await expect(getOrCreateRetryableMapPromise(cache, 'record', createValue)).resolves.toBe(
      'recovered',
    )
    expect(createValue).toHaveBeenCalledTimes(2)
  })
})
