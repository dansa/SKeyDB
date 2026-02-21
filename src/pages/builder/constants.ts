import { getAwakeners } from '../../domain/awakeners'
import type { TeamSlot } from './types'

export const SHOW_PICKER_TILE_STATUS_LABELS = true

export const initialTeamSlots: TeamSlot[] = [
  { slotId: 'slot-1', wheels: [null, null] },
  { slotId: 'slot-2', wheels: [null, null] },
  { slotId: 'slot-3', wheels: [null, null] },
  { slotId: 'slot-4', wheels: [null, null] },
]

export function createEmptyTeamSlots(): TeamSlot[] {
  return initialTeamSlots.map((slot) => ({
    ...slot,
    wheels: [...slot.wheels] as [string | null, string | null],
  }))
}

export const allAwakeners = getAwakeners()
export const awakenerByName = new Map(allAwakeners.map((awakener) => [awakener.name, awakener]))
