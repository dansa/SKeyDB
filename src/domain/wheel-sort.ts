import type { Wheel } from './wheels'

const WHEEL_RARITY_ORDER: Record<Wheel['rarity'], number> = {
  SSR: 0,
  SR: 1,
  R: 2,
}

const WHEEL_FACTION_ORDER: Record<Wheel['faction'], number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
  NEUTRAL: 4,
}

export function compareWheelsForUi(left: Wheel, right: Wheel): number {
  const rarityOrderDiff = WHEEL_RARITY_ORDER[left.rarity] - WHEEL_RARITY_ORDER[right.rarity]
  if (rarityOrderDiff !== 0) {
    return rarityOrderDiff
  }

  const factionOrderDiff = WHEEL_FACTION_ORDER[left.faction] - WHEEL_FACTION_ORDER[right.faction]
  if (factionOrderDiff !== 0) {
    return factionOrderDiff
  }

  return left.id.localeCompare(right.id, undefined, { numeric: true, sensitivity: 'base' })
}
