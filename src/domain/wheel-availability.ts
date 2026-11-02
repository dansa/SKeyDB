import {AVAILABILITY_LABELS} from './availability-filters'

export const WHEEL_AVAILABILITY_TYPES = [
  'PERMANENT',
  'LIMITED_FADED_LEGACY',
  'LIMITED_ASTRAL_REIGN',
  'EVENT',
  'BATTLE_PASS',
  'WELFARE',
  'UNKNOWN',
] as const

export type WheelAvailabilityType = (typeof WHEEL_AVAILABILITY_TYPES)[number]

export const WHEEL_AVAILABILITY_LABELS: Readonly<Record<WheelAvailabilityType, string>> =
  AVAILABILITY_LABELS
