import type { Awakener } from '../../domain/awakeners'
import type { TeamSlot } from './types'

export const awakenersByNameForTests = new Map<string, Awakener>([
  ['Goliath', { id: 1, name: 'Goliath', faction: 'AEQUOR', aliases: ['Goliath'] }],
  ['Miryam', { id: 2, name: 'Miryam', faction: 'AEQUOR', aliases: ['Miryam'] }],
  ['Ramona', { id: 3, name: 'Ramona', faction: 'CHAOS', aliases: ['Ramona'] }],
  ['Ramona: Timeworn', { id: 4, name: 'Ramona: Timeworn', faction: 'CHAOS', aliases: ['Ramona: Timeworn'] }],
  ['Castor', { id: 5, name: 'Castor', faction: 'CARO', aliases: ['Castor'] }],
  ['Helot', { id: 6, name: 'Helot', faction: 'CHAOS', aliases: ['Helot'] }],
])

export function teamSlotsForTests(): TeamSlot[] {
  return [
    { slotId: 'slot-1', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: ['w1', 'w2'] },
    { slotId: 'slot-2', awakenerName: 'Miryam', faction: 'AEQUOR', level: 60, wheels: [null, null] },
    { slotId: 'slot-3', wheels: [null, null] },
  ]
}

export function teamSlotsForTestsWithTwoFactions(): TeamSlot[] {
  return [
    { slotId: 'slot-1', awakenerName: 'Helot', faction: 'CHAOS', level: 60, wheels: ['w1', null] },
    { slotId: 'slot-2', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: [null, null] },
    { slotId: 'slot-3', wheels: [null, null] },
    { slotId: 'slot-4', awakenerName: 'Miryam', faction: 'AEQUOR', level: 60, wheels: [null, null] },
  ]
}
