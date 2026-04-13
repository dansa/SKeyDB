import {z} from 'zod'

import aliemusColorIcon from '@/assets/buffs/Aliemus_Color.png'
import blackSigilColorIcon from '@/assets/buffs/Black_Sigil_Color.png'
import critDamageColorIcon from '@/assets/buffs/Crit_DMG_Color.png'
import critRateColorIcon from '@/assets/buffs/Crit_Rate_Color.png'
import deathResistanceColorIcon from '@/assets/buffs/Death_Resistance_Color.png'
import damageAmpColorIcon from '@/assets/buffs/DMG_Amp_Color.png'
import keyflareRegenColorIcon from '@/assets/buffs/Keyflare_Regen_Color.png'
import realmMasteryColorIcon from '@/assets/buffs/Realm_Mastery_Color.png'
import icon001 from '@/assets/icons/UI_Battle_White_Buff_079.png'
import icon002 from '@/assets/icons/UI_Battle_White_Buff_080.png'
import icon003 from '@/assets/icons/UI_Battle_White_Buff_081.png'
import icon004 from '@/assets/icons/UI_Battle_White_Buff_082.png'
import icon005 from '@/assets/icons/UI_Battle_White_Buff_083.png'
import icon006 from '@/assets/icons/UI_Battle_White_Buff_084.png'
import icon007 from '@/assets/icons/UI_Battle_White_Buff_085.png'
import icon008 from '@/assets/icons/UI_Battle_White_Buff_086.png'
import icon009 from '@/assets/icons/UI_Battle_White_Buff_087.png'
import icon010 from '@/assets/icons/UI_Battle_White_Buff_088.png'
import icon011 from '@/assets/icons/UI_Battle_White_Buff_089.png'
import rawMainstats from '@/data/mainstats.json'

export const MAINSTAT_KEYS = [
  'CRIT_RATE',
  'CRIT_DMG',
  'REALM_MASTERY',
  'DMG_AMP',
  'ALIEMUS_REGEN',
  'KEYFLARE_REGEN',
  'SIGIL_YIELD',
  'DEATH_RESISTANCE',
  'ATK',
  'DEF',
  'CON',
] as const

export const WHEEL_MAINSTAT_KEYS = [
  'CRIT_RATE',
  'CRIT_DMG',
  'REALM_MASTERY',
  'DMG_AMP',
  'ALIEMUS_REGEN',
  'KEYFLARE_REGEN',
  'SIGIL_YIELD',
  'DEATH_RESISTANCE',
] as const

const mainstatSchema = z.object({
  key: z.enum(MAINSTAT_KEYS),
  label: z.string().trim().min(1),
  iconId: z.string().regex(/^\d{3}$/),
  aliases: z.array(z.string().trim().min(1)),
  wheelFilter: z.boolean(),
})

const parsedMainstats = z.array(mainstatSchema).parse(rawMainstats)

export type Mainstat = (typeof parsedMainstats)[number]
export type MainstatKey = (typeof MAINSTAT_KEYS)[number]
export type WheelMainstatKey = (typeof WHEEL_MAINSTAT_KEYS)[number]
type WheelMainstat = Mainstat & {key: WheelMainstatKey}

const mainstatByKey = new Map(parsedMainstats.map((mainstat) => [mainstat.key, mainstat]))
function normalizeValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const mainstatByNormalizedAlias = new Map<string, Mainstat>()
for (const mainstat of parsedMainstats) {
  mainstatByNormalizedAlias.set(normalizeValue(mainstat.label), mainstat)
  for (const alias of mainstat.aliases) {
    mainstatByNormalizedAlias.set(normalizeValue(alias), mainstat)
  }
}

export function getMainstats(): Mainstat[] {
  return parsedMainstats
}

export function getWheelFilterMainstats(): WheelMainstat[] {
  const wheelKeySet = new Set<string>(WHEEL_MAINSTAT_KEYS)
  return parsedMainstats.filter((mainstat): mainstat is WheelMainstat =>
    wheelKeySet.has(mainstat.key),
  )
}

export function getMainstatByKey(key: MainstatKey): Mainstat | undefined {
  return mainstatByKey.get(key)
}

export function normalizeMainstatLabel(value: string): string | null {
  const normalized = normalizeValue(value)
  if (!normalized) {
    return null
  }
  return mainstatByNormalizedAlias.get(normalized)?.label ?? null
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
  const mainstat = mainstatByKey.get(key)
  return mainstat ? MAINSTAT_ICON_BY_ID[mainstat.iconId] : undefined
}

export function getColoredMainstatIcon(key: MainstatKey): string | undefined {
  return MAINSTAT_COLORED_ICON_BY_KEY[key]
}

export function getMainstatAccentColor(key: MainstatKey): string {
  return MAINSTAT_ACCENT_COLOR_BY_KEY[key]
}

export {MAINSTAT_ICON_BY_ID}
