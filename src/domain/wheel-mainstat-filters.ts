import {getWheelFilterMainstats, MAINSTAT_ICON_BY_ID} from './mainstats'

export type WheelMainstatFilter =
  | 'ALL'
  | 'CRIT_RATE'
  | 'CRIT_DMG'
  | 'REALM_MASTERY'
  | 'DMG_AMP'
  | 'ALIEMUS_REGEN'
  | 'KEYFLARE_REGEN'
  | 'SIGIL_YIELD'
  | 'DEATH_RESISTANCE'

export interface WheelMainstatFilterOption {
  id: WheelMainstatFilter
  label: string
  iconAsset?: string
}

export const wheelMainstatFilterOptions: WheelMainstatFilterOption[] = [
  {id: 'ALL', label: 'All Mainstats'},
  ...getWheelFilterMainstats().map((mainstat) => ({
    id: mainstat.key,
    label: mainstat.label,
    iconAsset: MAINSTAT_ICON_BY_ID[mainstat.iconId],
  })),
]

export function matchesWheelMainstat(mainstatKey: string, filter: WheelMainstatFilter): boolean {
  if (filter === 'ALL') {
    return true
  }
  return mainstatKey === filter
}
