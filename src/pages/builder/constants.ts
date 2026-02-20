import { getAwakeners } from '../../domain/awakeners'
import type { TeamSlot } from './types'

export const SHOW_PICKER_TILE_STATUS_LABELS = true

export const initialTeamSlots: TeamSlot[] = [
  { slotId: 'slot-1', awakenerName: 'Goliath', faction: 'AEQUOR', level: 60, wheels: ['w1', 'w2'] },
  { slotId: 'slot-2', awakenerName: 'Murphy: Fauxborn', faction: 'AEQUOR', level: 76, wheels: ['w3', null] },
  { slotId: 'slot-3', awakenerName: 'Miryam', faction: 'AEQUOR', level: 60, wheels: [null, null] },
  { slotId: 'slot-4', wheels: [null, null] },
]

export const allAwakeners = getAwakeners()
export const awakenerByName = new Map(allAwakeners.map((awakener) => [awakener.name, awakener]))
