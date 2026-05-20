import {SUBSTAT_SCALING_KEYS, type SubstatScalingKey} from './awakener-source-schema'
import {getMainstatByKey, getMainstatIcon, type MainstatKey} from './mainstats'

export type {SubstatScalingKey} from './awakener-source-schema'

const MAINSTAT_KEY_BY_SCALING_SUBSTAT = {
  CritRate: 'CRIT_RATE',
  CritDamage: 'CRIT_DMG',
  AliemusRegen: 'ALIEMUS_REGEN',
  KeyflareRegen: 'KEYFLARE_REGEN',
  RealmMastery: 'REALM_MASTERY',
  SigilYield: 'SIGIL_YIELD',
  DamageAmplification: 'DMG_AMP',
  DeathResistance: 'DEATH_RESISTANCE',
} satisfies Record<SubstatScalingKey, MainstatKey>

const FALLBACK_SCALING_SUBSTAT_LABELS = {
  CritRate: 'Crit Rate',
  CritDamage: 'Crit DMG',
  AliemusRegen: 'Aliemus Regen',
  KeyflareRegen: 'Keyflare Regen',
  RealmMastery: 'Realm Mastery',
  SigilYield: 'Sigil Yield',
  DamageAmplification: 'DMG Amp',
  DeathResistance: 'Death Resistance',
} satisfies Record<SubstatScalingKey, string>

export const AWAKENER_SCALING_SUBSTAT_FILTER_IDS = SUBSTAT_SCALING_KEYS

export interface AwakenerScalingSubstatFilterOption {
  id: SubstatScalingKey
  label: string
  iconAsset?: string
}

export function isAwakenerScalingSubstatKey(key: string): key is SubstatScalingKey {
  return key in MAINSTAT_KEY_BY_SCALING_SUBSTAT
}

export function getAwakenerScalingSubstatLabel(key: SubstatScalingKey): string {
  const mainstatKey = MAINSTAT_KEY_BY_SCALING_SUBSTAT[key]
  return getMainstatByKey(mainstatKey)?.label ?? FALLBACK_SCALING_SUBSTAT_LABELS[key]
}

export function getAwakenerScalingSubstatSearchLabels(key: SubstatScalingKey): string[] {
  const mainstat = getMainstatByKey(MAINSTAT_KEY_BY_SCALING_SUBSTAT[key])
  if (!mainstat) {
    return [FALLBACK_SCALING_SUBSTAT_LABELS[key]]
  }
  return [mainstat.label, ...mainstat.aliases]
}

export function getAwakenerScalingSubstatFilterOptions(): AwakenerScalingSubstatFilterOption[] {
  return AWAKENER_SCALING_SUBSTAT_FILTER_IDS.map((id) => ({
    id,
    label: getAwakenerScalingSubstatLabel(id),
    iconAsset: getMainstatIcon(MAINSTAT_KEY_BY_SCALING_SUBSTAT[id]),
  }))
}
