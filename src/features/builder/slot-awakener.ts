import {awakenerById} from './constants'
import type {TeamSlot} from './types'

export function getSlotAwakener(slot: TeamSlot) {
  return slot.awakenerId ? awakenerById.get(slot.awakenerId) : undefined
}

export function getSlotAwakenerName(slot: TeamSlot): string | undefined {
  return getSlotAwakener(slot)?.name
}

export function hasSlotAwakener(slot: TeamSlot): boolean {
  return Boolean(slot.awakenerId && getSlotAwakener(slot))
}
