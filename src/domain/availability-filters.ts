export const COMMON_AVAILABILITY_FILTER_IDS = [
  'ALL',
  'LIMITED',
  'PERMANENT',
  'WELFARE',
  'LIMITED_FADED_LEGACY',
  'LIMITED_ASTRAL_REIGN',
] as const

export const AVAILABILITY_LABELS = {
  ALL: 'All',
  PERMANENT: 'Permanent',
  WELFARE: 'Shop / Welfare',
  LIMITED: 'Limited',
  LIMITED_FADED_LEGACY: 'Faded Legacy',
  LIMITED_ASTRAL_REIGN: 'Astral Reign',
  EVENT: 'Event',
  BATTLE_PASS: 'Battle Pass',
  UNKNOWN: 'Unknown',
} as const
