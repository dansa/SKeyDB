import icon001 from '../../assets/icons/UI_Battle_White_Buff_001.png'
import icon002 from '../../assets/icons/UI_Battle_White_Buff_002.png'
import icon003 from '../../assets/icons/UI_Battle_White_Buff_003.png'
import icon004 from '../../assets/icons/UI_Battle_White_Buff_004.png'
import icon005 from '../../assets/icons/UI_Battle_White_Buff_005.png'
import icon006 from '../../assets/icons/UI_Battle_White_Buff_006.png'
import icon007 from '../../assets/icons/UI_Battle_White_Buff_007.png'
import icon008 from '../../assets/icons/UI_Battle_White_Buff_008.png'
import { getWheelFilterMainstats } from '../../domain/mainstats'
import type { WheelMainstatFilter } from './types'

export type WheelMainstatFilterOption = {
  id: WheelMainstatFilter
  label: string
  iconAsset?: string
}

const MAINSTAT_ICON_BY_ID: Record<string, string> = {
  '001': icon001,
  '002': icon002,
  '003': icon003,
  '004': icon004,
  '005': icon005,
  '006': icon006,
  '007': icon007,
  '008': icon008,
}

export const wheelMainstatFilterOptions: WheelMainstatFilterOption[] = [
  { id: 'ALL', label: 'All Mainstats' },
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
