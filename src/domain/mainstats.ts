import aliemusColorIcon from '@/assets/icons/Aliemus_Color.png'
import blackSigilColorIcon from '@/assets/icons/Black_Sigil_Color.png'
import critDamageColorIcon from '@/assets/icons/Crit_DMG_Color.png'
import critRateColorIcon from '@/assets/icons/Crit_Rate_Color.png'
import deathResistanceColorIcon from '@/assets/icons/Death_Resistance_Color.png'
import damageAmpColorIcon from '@/assets/icons/DMG_Amp_Color.png'
import keyflareRegenColorIcon from '@/assets/icons/Keyflare_Regen_Color.png'
import realmMasteryColorIcon from '@/assets/icons/Realm_Mastery_Color.png'
import icon001 from '@/assets/icons/UI_Battle_White_Buff_001.webp'
import icon002 from '@/assets/icons/UI_Battle_White_Buff_002.webp'
import icon003 from '@/assets/icons/UI_Battle_White_Buff_003.webp'
import icon004 from '@/assets/icons/UI_Battle_White_Buff_004.webp'
import icon005 from '@/assets/icons/UI_Battle_White_Buff_005.webp'
import icon006 from '@/assets/icons/UI_Battle_White_Buff_006.webp'
import icon007 from '@/assets/icons/UI_Battle_White_Buff_007.webp'
import icon008 from '@/assets/icons/UI_Battle_White_Buff_008.webp'
import icon009 from '@/assets/icons/UI_Battle_White_Buff_009.webp'
import icon010 from '@/assets/icons/UI_Battle_White_Buff_010.webp'
import icon011 from '@/assets/icons/UI_Battle_White_Buff_011.webp'

import {getMainstatByKey, type MainstatKey} from './mainstats-catalog'

export {
  MAINSTAT_KEYS,
  WHEEL_MAINSTAT_KEYS,
  getMainstatByKey,
  getMainstats,
  getWheelFilterMainstats,
  normalizeMainstatLabel,
  type Mainstat,
  type MainstatKey,
  type WheelMainstatKey,
} from './mainstats-catalog'

const MAINSTAT_ICON_BY_ID: Record<string, string> = {
  '001': icon001,
  '002': icon002,
  '003': icon003,
  '004': icon004,
  '005': icon005,
  '006': icon006,
  '007': icon007,
  '008': icon008,
  '009': icon009,
  '010': icon010,
  '011': icon011,
}

const MAINSTAT_COLORED_ICON_BY_KEY: Partial<Record<MainstatKey, string>> = {
  CRIT_RATE: critRateColorIcon,
  CRIT_DMG: critDamageColorIcon,
  REALM_MASTERY: realmMasteryColorIcon,
  DMG_AMP: damageAmpColorIcon,
  ALIEMUS_REGEN: aliemusColorIcon,
  KEYFLARE_REGEN: keyflareRegenColorIcon,
  SIGIL_YIELD: blackSigilColorIcon,
  DEATH_RESISTANCE: deathResistanceColorIcon,
}

const MAINSTAT_ACCENT_COLOR_BY_KEY: Record<MainstatKey, string> = {
  CRIT_RATE: '#d8b56a',
  CRIT_DMG: '#c8747c',
  REALM_MASTERY: '#8d82d9',
  DMG_AMP: '#d48363',
  ALIEMUS_REGEN: '#67b0a1',
  KEYFLARE_REGEN: '#6aafcf',
  SIGIL_YIELD: '#b7a75b',
  DEATH_RESISTANCE: '#7f97bb',
  ATK: '#a1525a',
  DEF: '#638ea6',
  CON: '#5e9177',
}

export function getMainstatIcon(key: MainstatKey): string | undefined {
  const mainstat = getMainstatByKey(key)
  return mainstat ? MAINSTAT_ICON_BY_ID[mainstat.iconId] : undefined
}

export function getColoredMainstatIcon(key: MainstatKey): string | undefined {
  return MAINSTAT_COLORED_ICON_BY_KEY[key]
}

export function getMainstatAccentColor(key: MainstatKey): string {
  return MAINSTAT_ACCENT_COLOR_BY_KEY[key]
}

export {MAINSTAT_ICON_BY_ID}
