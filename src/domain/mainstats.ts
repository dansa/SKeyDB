import {z} from 'zod'

import icon001 from '@/assets/icons/UI_Battle_White_Buff_001.png'
import icon002 from '@/assets/icons/UI_Battle_White_Buff_002.png'
import icon003 from '@/assets/icons/UI_Battle_White_Buff_003.png'
import icon004 from '@/assets/icons/UI_Battle_White_Buff_004.png'
import icon005 from '@/assets/icons/UI_Battle_White_Buff_005.png'
import icon006 from '@/assets/icons/UI_Battle_White_Buff_006.png'
import icon007 from '@/assets/icons/UI_Battle_White_Buff_007.png'
import icon008 from '@/assets/icons/UI_Battle_White_Buff_008.png'
import icon009 from '@/assets/icons/UI_Battle_White_Buff_009.png'
import icon010 from '@/assets/icons/UI_Battle_White_Buff_010.png'
import icon011 from '@/assets/icons/UI_Battle_White_Buff_011.png'
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

export function getMainstatIcon(key: MainstatKey): string | undefined {
  const mainstat = mainstatByKey.get(key)
  return mainstat ? MAINSTAT_ICON_BY_ID[mainstat.iconId] : undefined
}

export {MAINSTAT_ICON_BY_ID}
