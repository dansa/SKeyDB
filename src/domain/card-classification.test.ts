import {describe, expect, it} from 'vitest'

import {
  formatCanonicalCardMetadata,
  getCanonicalCardClassificationLabels,
} from './card-classification'

describe('canonical card classification', () => {
  it('formats every canonical Mortal Blast classification without conflating counts-as', () => {
    expect(
      formatCanonicalCardMetadata(
        {
          cardFamily: 'command',
          cardTypes: ['skill'],
          countsAs: ['strike'],
        },
        '1',
      ),
    ).toBe('Cost 1 · Command · Skill · Counts as Strike')
  })

  it('deduplicates repeated family and type values while preserving multiple types', () => {
    expect(
      getCanonicalCardClassificationLabels({
        cardFamily: 'exalt',
        cardTypes: ['exalt'],
      }),
    ).toEqual(['Exalt'])
    expect(
      getCanonicalCardClassificationLabels({
        cardFamily: 'command',
        cardTypes: ['derived', 'pursuit'],
      }),
    ).toEqual(['Command', 'Derived', 'Pursuit'])
  })

  it('humanizes source values without a closed localization mapping', () => {
    expect(
      getCanonicalCardClassificationLabels({
        cardFamily: 'buff',
        cardTypes: ['over_exalt'],
      }),
    ).toEqual(['Buff', 'Over Exalt'])
  })
})
