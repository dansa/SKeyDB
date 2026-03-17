import type {TeamSlot} from '../types'

export const SUPPORT_AWAKENER_MAX_ENLIGHTEN = 15

export function getDisplayedAwakenerOwnedLevel(
  slot: Pick<TeamSlot, 'isSupport'>,
  ownedLevel: number | null,
): number | null {
  if (slot.isSupport) {
    return SUPPORT_AWAKENER_MAX_ENLIGHTEN
  }

  return ownedLevel
}
