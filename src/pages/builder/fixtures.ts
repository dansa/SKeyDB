import type { Awakener } from '../../domain/awakeners'
import type { TeamSlot } from './types'

export const awakenersByNameForTests = new Map<string, Awakener>([
  ['Goliath', { name: 'Goliath', faction: 'AEQUOR', aliases: ['Goliath'] }],
  ['Miryam', { name: 'Miryam', faction: 'AEQUOR', aliases: ['Miryam'] }],
  ['Ramona', { name: 'Ramona', faction: 'CHAOS', aliases: ['Ramona'] }],
  ['Ramona: Timeworn', { name: 'Ramona: Timeworn', faction: 'CHAOS', aliases: ['Ramona: Timeworn'] }],
  ['Castor', { name: 'Castor', faction: 'CARO', aliases: ['Castor'] }],
  ['Helot', { name: 'Helot', faction: 'CHAOS', aliases: ['Helot'] }],
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
