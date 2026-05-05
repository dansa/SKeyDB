import {describe, expect, it} from 'vitest'

import {getAwakenersLite} from './awakeners-lite'

describe('awakeners-lite', () => {
  it('loads public lite V2 records without using the retired local compiler path', () => {
    const records = getAwakenersLite()

    expect(records.length).toBeGreaterThan(0)
    expect(records[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        aliases: expect.any(Array),
        tags: expect.any(Array),
      }),
    )
  })

  it('exposes public V2 search tags without synthesizing website-side overlay tags', () => {
    const records = getAwakenersLite()
    const vortice = records.find((entry) => entry.name === 'vortice')
    const fauxbornMurphy = records.find((entry) => entry.name === 'murphy: fauxborn')
    const twentyFour = records.find((entry) => entry.name === '24')

    expect(vortice?.tags).toEqual(expect.arrayContaining(['Dispel', 'Divine Realm', 'Tentacles']))
    expect(fauxbornMurphy?.tags).toEqual(
      expect.arrayContaining(['Arithmetica', 'Divine Realm', 'Draw', 'Keyflare', 'Tentacles']),
    )
    expect(twentyFour?.tags).toEqual(
      expect.arrayContaining(['Arithmetica', 'Hand Limit', 'Keyflare', 'Tentacles']),
    )
  })

  it('filters out low-signal overlay references like Retain and Exhaust', () => {
    const tags = new Set(getAwakenersLite().flatMap((entry) => entry.tags))

    expect(tags.has('Retain')).toBe(false)
    expect(tags.has('Exhaust')).toBe(false)
  })
})
