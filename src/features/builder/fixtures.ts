import type {Awakener} from '@/domain/awakeners'

import type {TeamSlot} from './types'

export const awakenersByNameForTests = new Map<string, Awakener>([
  [
    'Goliath',
    {
      id: 'awakener-0021',
      name: 'Goliath',
      faction: 'Hybrid',
      realm: 'AEQUOR',
      aliases: ['Goliath'],
      tags: [],
      lineupToken: 'a',
    },
  ],
  [
    'Miryam',
    {
      id: 'awakener-0032',
      name: 'Miryam',
      faction: 'Hybrid',
      realm: 'AEQUOR',
      aliases: ['Miryam'],
      tags: [],
      lineupToken: 'b',
    },
  ],
  [
    'Ramona',
    {
      id: 'awakener-0042',
      name: 'Ramona',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['Ramona'],
      tags: [],
      lineupToken: 'c',
    },
  ],
  [
    'Ramona: Timeworn',
    {
      id: 'awakener-0020',
      name: 'Ramona: Timeworn',
      faction: 'The Fools',
      realm: 'CHAOS',
      aliases: ['Ramona: Timeworn'],
      tags: [],
      lineupToken: 'd',
    },
  ],
  [
    'Castor',
    {
      id: 'awakener-0008',
      name: 'Castor',
      faction: 'Outlanders',
      realm: 'CARO',
      aliases: ['Castor'],
      tags: [],
      lineupToken: 'e',
    },
  ],
  [
    'Helot',
    {
      id: 'awakener-0023',
      name: 'Helot',
      faction: 'Among the Stars',
      realm: 'CHAOS',
      aliases: ['Helot'],
      tags: [],
      lineupToken: 'f',
    },
  ],
])

export const awakenersByIdForTests = new Map(
  Array.from(awakenersByNameForTests.values()).map((awakener) => [awakener.id, awakener]),
)

export function teamSlotsForTests(): TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      level: 60,
      wheels: ['w1', 'w2'],
    },
    {
      slotId: 'slot-2',
      awakenerId: 'awakener-0032',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null],
    },
    {slotId: 'slot-3', wheels: [null, null]},
  ]
}

export function teamSlotsForTestsWithTwoFactions(): TeamSlot[] {
  return [
    {
      slotId: 'slot-1',
      awakenerId: 'awakener-0023',
      realm: 'CHAOS',
      level: 60,
      wheels: ['w1', null],
    },
    {
      slotId: 'slot-2',
      awakenerId: 'awakener-0021',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null],
    },
    {slotId: 'slot-3', wheels: [null, null]},
    {
      slotId: 'slot-4',
      awakenerId: 'awakener-0032',
      realm: 'AEQUOR',
      level: 60,
      wheels: [null, null],
    },
  ]
}
