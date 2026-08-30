import scopesIndexJson from '@/data/public-v3/indexes/scopes.json'

import {
  PUBLIC_DATA_SCOPES,
  type EntityKind,
  type PublicCatalog,
  type PublicCatalogRecord,
  type PublicDataScope,
  type PublicRecord,
} from './contract'
import {isPublicEntityId} from './ids'
import {publicScopesIndexSchema} from './schemas'

export type PublicScopeCapability = 'catalog' | 'detailRecord' | 'search' | 'snapshot'

export interface PublicScopeDescriptor {
  scope: PublicDataScope
  kind: EntityKind
  idPrefix: string
  capabilities: readonly PublicScopeCapability[]
  hasRouteIndex: boolean
  recordCount: number
}

const GENERATED_PUBLIC_SCOPE_METADATA = publicScopesIndexSchema.parse(scopesIndexJson)

function buildPublicScopeDescriptors(): Record<PublicDataScope, PublicScopeDescriptor> {
  const descriptors = {} as Record<PublicDataScope, PublicScopeDescriptor>

  for (const scope of PUBLIC_DATA_SCOPES) {
    const metadata = GENERATED_PUBLIC_SCOPE_METADATA.byScope[scope]
    descriptors[scope] = {
      scope: metadata.scope,
      kind: metadata.kind,
      idPrefix: metadata.idPrefix,
      capabilities: metadata.capabilities,
      hasRouteIndex: true,
      recordCount: metadata.recordCount,
    }
  }

  return descriptors
}

export const PUBLIC_SCOPE_DESCRIPTORS = buildPublicScopeDescriptors()

export type PublicDataScopeWithCapability<TCapability extends PublicScopeCapability> =
  TCapability extends 'search'
    ? 'awakeners' | 'covenants' | 'orisons' | 'posses' | 'relics' | 'wheels'
    : PublicDataScope

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
