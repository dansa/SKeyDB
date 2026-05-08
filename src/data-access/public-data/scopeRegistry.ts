import type {
  EntityKind,
  PublicCatalog,
  PublicCatalogRecord,
  PublicDataScope,
  PublicRecord,
} from './contract'
import {isPublicEntityId} from './ids'

export type PublicScopeCapability = 'catalog' | 'detailRecord' | 'search' | 'snapshot'

export interface PublicScopeDescriptor {
  scope: PublicDataScope
  kind: EntityKind
  idPrefix: string
  capabilities: readonly PublicScopeCapability[]
  hasRouteIndex: boolean
}

export const PUBLIC_SCOPE_DESCRIPTORS = {
  'awakener-builds': {
    scope: 'awakener-builds',
    kind: 'awakenerBuild',
    idPrefix: 'awakener-build-',
    capabilities: ['catalog', 'detailRecord'],
    hasRouteIndex: true,
  },
  awakeners: {
    scope: 'awakeners',
    kind: 'awakener',
    idPrefix: 'awakener-',
    capabilities: ['catalog', 'detailRecord', 'search'],
    hasRouteIndex: true,
  },
  covenants: {
    scope: 'covenants',
    kind: 'covenant',
    idPrefix: 'covenant-',
    capabilities: ['catalog', 'detailRecord', 'search', 'snapshot'],
    hasRouteIndex: true,
  },
  'derived-skills': {
    scope: 'derived-skills',
    kind: 'derivedSkill',
    idPrefix: 'derived.',
    capabilities: ['catalog', 'detailRecord', 'snapshot'],
    hasRouteIndex: true,
  },
  enlightens: {
    scope: 'enlightens',
    kind: 'enlighten',
    idPrefix: 'enlighten.',
    capabilities: ['catalog', 'detailRecord', 'snapshot'],
    hasRouteIndex: true,
  },
  overlays: {
    scope: 'overlays',
    kind: 'overlay',
    idPrefix: 'overlay.',
    capabilities: ['catalog', 'detailRecord', 'snapshot'],
    hasRouteIndex: true,
  },
  posses: {
    scope: 'posses',
    kind: 'posse',
    idPrefix: 'posse-',
    capabilities: ['catalog', 'detailRecord', 'search', 'snapshot'],
    hasRouteIndex: true,
  },
  relics: {
    scope: 'relics',
    kind: 'relic',
    idPrefix: 'relic-',
    capabilities: ['catalog', 'detailRecord', 'search', 'snapshot'],
    hasRouteIndex: true,
  },
  skills: {
    scope: 'skills',
    kind: 'skill',
    idPrefix: 'skill.',
    capabilities: ['catalog', 'detailRecord', 'snapshot'],
    hasRouteIndex: true,
  },
  talents: {
    scope: 'talents',
    kind: 'talent',
    idPrefix: 'talent.',
    capabilities: ['catalog', 'detailRecord', 'snapshot'],
    hasRouteIndex: true,
  },
  wheels: {
    scope: 'wheels',
    kind: 'wheel',
    idPrefix: 'wheel-',
    capabilities: ['catalog', 'detailRecord', 'search', 'snapshot'],
    hasRouteIndex: true,
  },
} as const satisfies Record<PublicDataScope, PublicScopeDescriptor>

type PublicScopeDescriptors = typeof PUBLIC_SCOPE_DESCRIPTORS

export type PublicDataScopeWithCapability<TCapability extends PublicScopeCapability> = {
  [TScope in PublicDataScope]: TCapability extends PublicScopeDescriptors[TScope]['capabilities'][number]
    ? TScope
    : never
}[PublicDataScope]

export type SearchablePublicDataScope = PublicDataScopeWithCapability<'search'>
export type SnapshotPublicDataScope = PublicDataScopeWithCapability<'snapshot'>

export function getPublicScopeDescriptor(scope: PublicDataScope): PublicScopeDescriptor {
  return PUBLIC_SCOPE_DESCRIPTORS[scope]
}

export function assertPublicScopeCapability<TCapability extends PublicScopeCapability>(
  scope: PublicDataScope,
  capability: TCapability,
): asserts scope is PublicDataScopeWithCapability<TCapability> {
  if (!getPublicScopeDescriptor(scope).capabilities.includes(capability)) {
    throw new Error(`Public V3 scope "${scope}" does not support ${formatCapability(capability)}.`)
  }
}

export function assertPublicCatalogForScope(
  requestedScope: PublicDataScope,
  catalog: PublicCatalog,
): void {
  const descriptor = getPublicScopeDescriptor(requestedScope)
  assertPublicScopeCapability(requestedScope, 'catalog')

  if (catalog.scope !== requestedScope) {
    throw new Error(
      `Public V3 catalog scope "${catalog.scope}" does not match requested scope "${requestedScope}".`,
    )
  }
  if (catalog.kind !== descriptor.kind) {
    throw new Error(
      `Public V3 catalog "${requestedScope}" has kind "${catalog.kind}", expected "${descriptor.kind}".`,
    )
  }

  for (const record of catalog.records) {
    assertPublicCatalogRecordForScope(requestedScope, record)
  }
}

export function assertPublicCatalogRecordForScope(
  scope: PublicDataScope,
  record: PublicCatalogRecord,
): void {
  assertPublicEntityForScope(scope, record.kind, record.id)
}

export function assertPublicRecordForScope(
  scope: PublicDataScope,
  record: PublicRecord,
  requestedId?: string,
): void {
  assertPublicEntityForScope(scope, record.kind, record.id)
  if (requestedId !== undefined && record.id !== requestedId) {
    throw new Error(`Public V3 record path id "${requestedId}" loaded record "${record.id}".`)
  }
}

export function assertPublicEntityForScope(
  scope: PublicDataScope,
  kind: EntityKind,
  id: string,
): void {
  const descriptor = getPublicScopeDescriptor(scope)
  if (kind !== descriptor.kind) {
    throw new Error(
      `Public V3 scope "${scope}" loaded ${kind} record "${id}", expected "${descriptor.kind}".`,
    )
  }
  if (!isPublicEntityId(descriptor.kind, id) || !id.startsWith(descriptor.idPrefix)) {
    throw new Error(
      `Public V3 scope "${scope}" loaded ${descriptor.kind} record with invalid id "${id}".`,
    )
  }
}

function formatCapability(capability: PublicScopeCapability): string {
  switch (capability) {
    case 'detailRecord':
      return 'detail records'
    case 'search':
      return 'search indexes'
    case 'snapshot':
      return 'synchronous record snapshots'
    case 'catalog':
      return 'catalogs'
  }
}
