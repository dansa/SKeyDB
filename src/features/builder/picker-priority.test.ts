import {describe, expect, it} from 'vitest'

import {orderBuilderPickerItems} from './picker-priority'

describe('builder picker priority', () => {
  const items = [
    {id: 'unowned-used', owned: false, used: true},
    {id: 'owned-used', owned: true, used: true},
    {id: 'unowned-unused', owned: false, used: false},
    {id: 'owned-unused', owned: true, used: false},
    {id: 'owned-unused-2', owned: true, used: false},
  ]
  it.each([
    [
      false,
      false,
      ['unowned-used', 'owned-used', 'unowned-unused', 'owned-unused', 'owned-unused-2'],
    ],
    [
      true,
      false,
      ['owned-used', 'owned-unused', 'owned-unused-2', 'unowned-used', 'unowned-unused'],
    ],
    [
      false,
      true,
      ['unowned-unused', 'owned-unused', 'owned-unused-2', 'unowned-used', 'owned-used'],
    ],
    [
      true,
      true,
      ['owned-unused', 'owned-unused-2', 'owned-used', 'unowned-unused', 'unowned-used'],
    ],
  ] as const)(
    'orders ownership=%s usage=%s without mutating or disturbing ties',
    (sinkUnownedToBottom, unusedFirst, expected) => {
      const before = [...items]
      const result = orderBuilderPickerItems(items, {
        sinkUnownedToBottom,
        unusedFirst,
        isOwned: (item) => item.owned,
        isUsed: (item) => item.used,
      })
      expect(result.map((item) => item.id)).toEqual(expected)
      expect(items).toEqual(before)
    },
  )
})
