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

export const AWAKENER_SCALING_SUBSTAT_FILTER_ROLE_IDS = ['ANY', 'PRIMARY', 'SECONDARY'] as const
export type AwakenerScalingSubstatFilterRole =
  (typeof AWAKENER_SCALING_SUBSTAT_FILTER_ROLE_IDS)[number]
export type AwakenerScalingSubstatRole = 'MAIN' | 'SUB'
export type AwakenerScalingSubstatValues = Partial<Record<SubstatScalingKey, number | string>>

export interface AwakenerScalingSubstatFilter {
  key: SubstatScalingKey
  role: AwakenerScalingSubstatFilterRole
}

const MAIN_SUBSTAT_SCALING_VALUES = {
  CritRate: 1.6,
  CritDamage: 2.4,
  AliemusRegen: 0.8,
  KeyflareRegen: 2.4,
  RealmMastery: 4,
  SigilYield: 1.2,
  DamageAmplification: 1.6,
  DeathResistance: 5.6,
} satisfies Record<SubstatScalingKey, number>

export interface AwakenerScalingSubstatFilterOption {
  id: SubstatScalingKey
  label: string
  iconAsset?: string
}

export function getAwakenerScalingSubstatLabel(key: SubstatScalingKey): string {
  const mainstatKey = MAINSTAT_KEY_BY_SCALING_SUBSTAT[key]
  return getMainstatByKey(mainstatKey)?.label ?? FALLBACK_SCALING_SUBSTAT_LABELS[key]
}

export function getAwakenerScalingSubstatIcon(key: SubstatScalingKey): string | undefined {
  return getMainstatIcon(MAINSTAT_KEY_BY_SCALING_SUBSTAT[key])
}

export function inferAwakenerScalingSubstatRole(
  substatScaling: AwakenerScalingSubstatValues | null | undefined,
  key: SubstatScalingKey,
): AwakenerScalingSubstatRole | null {
  const value = Number(substatScaling?.[key] ?? 0)
  if (value <= 0) {
    return null
  }
  return value >= MAIN_SUBSTAT_SCALING_VALUES[key] ? 'MAIN' : 'SUB'
}

export function hasAwakenerScalingSubstat(
  substatScaling: AwakenerScalingSubstatValues | null | undefined,
  key: SubstatScalingKey,
): boolean {
  return inferAwakenerScalingSubstatRole(substatScaling, key) !== null
}

export function matchesAwakenerScalingSubstatRole(
  substatScaling: AwakenerScalingSubstatValues | null | undefined,
  key: SubstatScalingKey,
  role: AwakenerScalingSubstatRole,
): boolean {
  return inferAwakenerScalingSubstatRole(substatScaling, key) === role
}

export function matchesAwakenerScalingSubstatRoleFilter(
  substatScaling: AwakenerScalingSubstatValues | null | undefined,
  key: SubstatScalingKey,
  roleFilter: AwakenerScalingSubstatFilterRole,
): boolean {
  const role = inferAwakenerScalingSubstatRole(substatScaling, key)
  if (roleFilter === 'ANY') {
    return role !== null
  }
  return roleFilter === 'PRIMARY' ? role === 'MAIN' : role === 'SUB'
}

export function getAwakenerScalingSubstatFilterRoleLabel(
  role: AwakenerScalingSubstatFilterRole,
): string {
  if (role === 'PRIMARY') {
    return 'Primary scaling'
  }
  if (role === 'SECONDARY') {
    return 'Secondary scaling'
  }
  return 'Any role'
}

export function getAwakenerScalingSubstatFilterChipLabel(
  filter: AwakenerScalingSubstatFilter,
): string {
  const label = getAwakenerScalingSubstatLabel(filter.key)
  if (filter.role === 'PRIMARY') {
    return `Primary scaling: ${label}`
  }
  if (filter.role === 'SECONDARY') {
    return `Secondary scaling: ${label}`
  }
  return `Scaling: ${label}`
}

export function getAwakenerScalingSubstatFilterOptions(): AwakenerScalingSubstatFilterOption[] {
  return AWAKENER_SCALING_SUBSTAT_FILTER_IDS.map((id) => ({
    id,
    label: getAwakenerScalingSubstatLabel(id),
    iconAsset: getAwakenerScalingSubstatIcon(id),
  }))
}
