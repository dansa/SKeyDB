import type {
  EntityKind,
  EntityRef,
  PublicDataScope,
  PublicEntitySummary,
} from '@/data-access/public-data/contract'
import {isPublicEntityId as isContractPublicEntityId} from '@/data-access/public-data/ids'

import type {Awakener, AwakenerLiteStats} from '../awakeners'
import type {Covenant} from '../covenants'
import type {Posse} from '../posses'
import type {Wheel, WheelRarity, WheelRealm} from '../wheels'

export type {EntityKind, EntityRef, PublicDataScope, PublicEntitySummary}
export type {Awakener, AwakenerLiteStats, Covenant, Posse, Wheel, WheelRarity, WheelRealm}

export type PublicEntityId = string & {readonly __publicEntityId: unique symbol}

export const PUBLIC_DATA_SCOPE_BY_ENTITY_KIND = {
  awakener: 'awakeners',
  awakenerBuild: 'awakener-builds',
  covenant: 'covenants',
  derivedSkill: 'derived-skills',
  enlighten: 'enlightens',
  overlay: 'overlays',
  posse: 'posses',
  relic: 'relics',
  skill: 'skills',
  talent: 'talents',
  wheel: 'wheels',
} as const satisfies Record<EntityKind, PublicDataScope>

export const ENTITY_KIND_BY_PUBLIC_DATA_SCOPE = Object.fromEntries(
  Object.entries(PUBLIC_DATA_SCOPE_BY_ENTITY_KIND).map(([kind, scope]) => [scope, kind]),
) as Record<PublicDataScope, EntityKind>

export function getPublicDataScopeForEntityKind(kind: EntityKind): PublicDataScope {
  return PUBLIC_DATA_SCOPE_BY_ENTITY_KIND[kind]
}

export function getEntityKindForPublicDataScope(scope: PublicDataScope): EntityKind {
  return ENTITY_KIND_BY_PUBLIC_DATA_SCOPE[scope]
}

export function isPublicEntityId(kind: EntityKind, id: string): boolean {
  return isContractPublicEntityId(kind, id)
}

export function asPublicEntityId(kind: EntityKind, id: string): PublicEntityId | null {
  return isPublicEntityId(kind, id) ? (id as PublicEntityId) : null
}

export function assertPublicEntityId(kind: EntityKind, id: string): PublicEntityId {
  const publicId = asPublicEntityId(kind, id)
  if (!publicId) {
    throw new Error(`Invalid public ${kind} id: ${id}`)
  }
  return publicId
}
