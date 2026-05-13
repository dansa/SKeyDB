import realmIconAequor from '@/assets/factions/aequor.webp'
import realmIconCaro from '@/assets/factions/caro.webp'
import realmIconChaos from '@/assets/factions/chaos.webp'
import realmIconUltra from '@/assets/factions/ultra.webp'
import realmBadgeAequor from '@/assets/ui/realm-badge-aequor.webp'
import realmBadgeCaro from '@/assets/ui/realm-badge-caro.webp'
import realmBadgeChaos from '@/assets/ui/realm-badge-chaos.webp'
import realmBadgeUltra from '@/assets/ui/realm-badge-ultra.webp'
import type {DzoneRealm} from '@/domain/dzone'

const DZONE_REALM_BADGES: Record<DzoneRealm, string> = {
  AEQUOR: realmBadgeAequor,
  CARO: realmBadgeCaro,
  CHAOS: realmBadgeChaos,
  ULTRA: realmBadgeUltra,
}

const DZONE_REALM_ICONS: Record<DzoneRealm, string> = {
  AEQUOR: realmIconAequor,
  CARO: realmIconCaro,
  CHAOS: realmIconChaos,
  ULTRA: realmIconUltra,
}

export function getDzoneRealmBadgeAsset(realm: DzoneRealm | null | undefined): string {
  return realm ? DZONE_REALM_BADGES[realm] : realmBadgeAequor
}

export function getDzoneRealmIconAsset(realm: DzoneRealm | null | undefined): string | undefined {
  return realm ? DZONE_REALM_ICONS[realm] : undefined
}
