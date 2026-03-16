import aequorIcon from '@/assets/factions/aequor.webp'
import caroIcon from '@/assets/factions/caro.webp'
import chaosIcon from '@/assets/factions/chaos.webp'
import ultraIcon from '@/assets/factions/ultra.webp'

export const DEFAULT_REALM_TINT = '#7a8da8'

export const REALM_LABEL_BY_ID = {
  AEQUOR: 'Aequor',
  CARO: 'Caro',
  CHAOS: 'Chaos',
  ULTRA: 'Ultra',
} as const

export const REALM_TINT_BY_ID: Record<string, string> = {
  AEQUOR: '#6aabec',
  CARO: '#e46161',
  CHAOS: '#e3c96e',
  ULTRA: '#aa89dd',
}

export const REALM_ICON_BY_ID: Record<string, string> = {
  AEQUOR: aequorIcon,
  CARO: caroIcon,
  CHAOS: chaosIcon,
  ULTRA: ultraIcon,
}

export const REALM_TINT_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REALM_TINT_BY_ID).map(([id, tint]) => [
    REALM_LABEL_BY_ID[id as keyof typeof REALM_LABEL_BY_ID],
    tint,
  ]),
)

export function normalizeRealmId(realm: string): string {
  return realm.trim().toUpperCase()
}

export function getRealmTint(realmId: string | undefined): string {
  if (!realmId) {
    return DEFAULT_REALM_TINT
  }
  return REALM_TINT_BY_ID[normalizeRealmId(realmId)] ?? DEFAULT_REALM_TINT
}

export function getRealmLabel(realmId: string): string {
  const normalizedRealmId = normalizeRealmId(realmId)
  if (normalizedRealmId in REALM_LABEL_BY_ID) {
    return REALM_LABEL_BY_ID[normalizedRealmId as keyof typeof REALM_LABEL_BY_ID]
  }
  return realmId
}

export function getRealmIcon(realmId: string | undefined): string | undefined {
  if (!realmId) {
    return undefined
  }
  return REALM_ICON_BY_ID[normalizeRealmId(realmId)]
}

// Legacy aliases kept temporarily while the rest of the UI is migrated.
export const DEFAULT_FACTION_TINT = DEFAULT_REALM_TINT
export const FACTION_LABEL_BY_ID = REALM_LABEL_BY_ID
export const FACTION_TINT_BY_ID = REALM_TINT_BY_ID
export const FACTION_ICON_BY_ID = REALM_ICON_BY_ID
export const normalizeFactionId = normalizeRealmId
export const getFactionTint = getRealmTint
export const getFactionLabel = getRealmLabel
export const getFactionIcon = getRealmIcon
