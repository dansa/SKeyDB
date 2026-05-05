import {ENLIGHTEN_SLOT_KEYS, type AwakenerEnlightenRecord} from '@/domain/awakener-source-schema'

export function isEnlightenSlotActive(
  slot: AwakenerEnlightenRecord['slot'],
  selectedEnlightenSlot: AwakenerEnlightenRecord['slot'] | null,
): boolean {
  if (selectedEnlightenSlot === null) {
    return false
  }

  return ENLIGHTEN_SLOT_KEYS.indexOf(slot) <= ENLIGHTEN_SLOT_KEYS.indexOf(selectedEnlightenSlot)
}

export function getEnlightenSlotLabel(slot: AwakenerEnlightenRecord['slot']): string {
  return slot === 'AbsoluteAxiom' ? 'AA' : slot
}
