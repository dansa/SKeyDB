import { z } from 'zod'
import rawMainstats from '../data/mainstats.json'

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
type WheelMainstat = Mainstat & { key: WheelMainstatKey }

const mainstatByKey = new Map(parsedMainstats.map((mainstat) => [mainstat.key, mainstat]))
function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '')
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
  return parsedMainstats.filter((mainstat): mainstat is WheelMainstat => wheelKeySet.has(mainstat.key))
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
