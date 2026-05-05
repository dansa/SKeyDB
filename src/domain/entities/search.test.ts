import {describe, expect, it} from 'vitest'

import {collectDirectMatches, mergeDirectAndFuzzyMatches, toPriority} from './search'

interface TestRecord {
  entity: {id: string; name: string}
  priority: number | null
}

describe('entity search helpers', () => {
  it('maps search field matches to entity-specific priorities', () => {
    expect(
      toPriority({kind: 'wordPrefix'}, {exact: 0, prefix: 1, wordPrefix: 2, contains: 6}),
    ).toBe(2)
    expect(toPriority(null, {exact: 0, prefix: 1, wordPrefix: 2, contains: 6})).toBeNull()
  })

  it('can ignore sentinel priorities for entities that suppress broad matches', () => {
    expect(
      toPriority(
        {kind: 'contains'},
        {exact: 0, prefix: 1, wordPrefix: 2, contains: 99},
        {ignorePriorityAtOrAbove: 99},
      ),
    ).toBeNull()
  })

  it('collects direct matches sorted by priority then display name', () => {
    const records: TestRecord[] = [
      {entity: {id: '2', name: 'Beta'}, priority: 1},
      {entity: {id: '3', name: 'Gamma'}, priority: null},
      {entity: {id: '1', name: 'alpha'}, priority: 1},
      {entity: {id: '4', name: 'Delta'}, priority: 0},
    ]

    expect(
      collectDirectMatches({
        records,
        getPriority: (record) => record.priority,
        getDisplayName: (record) => record.entity.name,
        getEntity: (record) => record.entity,
      }).map((entity) => entity.id),
    ).toEqual(['4', '1', '2'])
  })

  it('appends fuzzy matches without duplicating direct matches', () => {
    const alpha = {id: '1', name: 'Alpha'}
    const beta = {id: '2', name: 'Beta'}
    const gamma = {id: '3', name: 'Gamma'}

    expect(
      mergeDirectAndFuzzyMatches([alpha, beta], [beta, gamma], (entity) => entity.id).map(
        (entity) => entity.id,
      ),
    ).toEqual(['1', '2', '3'])
  })
})
