import {chainComparators, compareMappedRank} from './sorting'
import type {Wheel} from './wheels'

const WHEEL_RARITY_RANK: Record<string, number> = {
  SSR: 0,
  SR: 1,
  R: 2,
}

const WHEEL_REALM_RANK: Record<string, number> = {
  CHAOS: 0,
  AEQUOR: 1,
  CARO: 2,
  ULTRA: 3,
  NEUTRAL: 4,
}

export const compareWheelsForUi = chainComparators<Wheel>(
  (l, r) => compareMappedRank(l, r, WHEEL_RARITY_RANK, (w) => w.rarity),
  (l, r) => compareMappedRank(l, r, WHEEL_REALM_RANK, (w) => w.realm),
  (l, r) => l.id.localeCompare(r.id, undefined, {numeric: true, sensitivity: 'base'}),
)
