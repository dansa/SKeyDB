import {describe, expect, it} from 'vitest'

import {getCollectiblePosses, getEquippablePosses, getPosses} from './posses'
import {loadPublicPosseDetailById} from './public-detail-record-adapters'

describe('getPosses', () => {
  it('returns posses with stable numeric indexes', () => {
    const posses = getPosses()

    expect(posses.length).toBeGreaterThan(0)
    expect(posses[0]).toMatchObject({
      id: expect.any(String),
      index: expect.any(Number),
      name: expect.any(String),
      realm: expect.any(String),
      isFadedLegacy: expect.any(Boolean),
    })
    expect(posses.every((posse) => Number.isInteger(posse.index) && posse.index >= 0)).toBe(true)
  })

  it('uses public V3 posse ids as runtime ids without legacy leakage', () => {
    const posses = getPosses()
    const firstPosse = posses.find((posse) => posse.id === 'posse-0001')

    expect(firstPosse).toMatchObject({
      id: 'posse-0001',
      index: 1,
      isFadedLegacy: true,
    })
    expect(
      posses.every(
        (posse) =>
          !('source' in posse) &&
          !('legacyId' in posse) &&
          !('sourceConfigId' in posse) &&
          !('publicId' in posse),
      ),
    ).toBe(true)
  })

  it('ensures posse indexes are unique', () => {
    const posses = getPosses()
    const indices = posses.map((posse) => posse.index)
    const uniqueIndices = new Set(indices)

    expect(uniqueIndices.size).toBe(indices.length)
  })

  it('keeps Primordial Memories browsable but out of equipment and ownership pools', () => {
    const memory = getPosses().find((posse) => posse.classification === 'PRIMORDIAL_MEMORY')

    expect(memory).toMatchObject({equippable: false, collectible: false})
    expect(getEquippablePosses()).not.toContainEqual(memory)
    expect(getCollectiblePosses()).not.toContainEqual(memory)
  })

  it('loads acquisition copy lazily from V3 detail records', async () => {
    const encounter = await loadPublicPosseDetailById('posse-0001')

    expect(encounter?.acquisitionSource).toBe(
      'Clear Operation: Faded Legacy - Ch. 3 - Beware of Hounds',
    )
    expect(encounter).not.toHaveProperty('source')
  })
})
