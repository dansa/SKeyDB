import aequorIcon from '../assets/factions/aequor.png'
import caroIcon from '../assets/factions/caro.png'
import chaosIcon from '../assets/factions/chaos.png'
import ultraIcon from '../assets/factions/ultra.png'

export const DEFAULT_FACTION_TINT = '#7a8da8'

export const FACTION_LABEL_BY_ID = {
  AEQUOR: 'Aequor',
  CARO: 'Caro',
  CHAOS: 'Chaos',
  ULTRA: 'Ultra',
} as const

export const FACTION_TINT_BY_ID: Record<string, string> = {
  AEQUOR: '#6aabec',
  CARO: '#e46161',
  CHAOS: '#e3c96e',
  ULTRA: '#aa89dd',
}

export const FACTION_ICON_BY_ID: Record<string, string> = {
  AEQUOR: aequorIcon,
  CARO: caroIcon,
  CHAOS: chaosIcon,
  ULTRA: ultraIcon,
}

export function normalizeFactionId(faction: string): string {
  return faction.trim().toUpperCase()
}

export function getFactionTint(factionId: string | undefined): string {
  if (!factionId) {
    return DEFAULT_FACTION_TINT
  }
  return FACTION_TINT_BY_ID[normalizeFactionId(factionId)] ?? DEFAULT_FACTION_TINT
}

export function getFactionLabel(factionId: string): string {
  return FACTION_LABEL_BY_ID[normalizeFactionId(factionId) as keyof typeof FACTION_LABEL_BY_ID] ?? factionId
}

export function getFactionIcon(factionId: string | undefined): string | undefined {
  if (!factionId) {
    return undefined
  }
  return FACTION_ICON_BY_ID[normalizeFactionId(factionId)]
}
