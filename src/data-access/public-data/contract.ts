export const PUBLIC_DATA_SCOPES = [
  'awakener-builds',
  'awakeners',
  'covenants',
  'derived-skills',
  'enlightens',
  'overlays',
  'posses',
  'relics',
  'skills',
  'talents',
  'wheels',
] as const

export type PublicDataScope = (typeof PUBLIC_DATA_SCOPES)[number]

export const ENTITY_KINDS = [
  'awakener',
  'awakenerBuild',
  'covenant',
  'derivedSkill',
  'enlighten',
  'overlay',
  'posse',
  'relic',
  'skill',
  'talent',
  'wheel',
] as const

export type EntityKind = (typeof ENTITY_KINDS)[number]

export type PublicAssetSlot = string

export interface EntityRef {
  kind: EntityKind
  id: string
}

export interface PublicRouteInfo {
  slug: string
  canonicalPath: string
}

export interface PublicRouteIndexEntry extends EntityRef {
  canonicalSlug: string
  canonicalPath: string
}

export interface PublicRouteResolutionOk {
  status: 'ok'
  ref: EntityRef
  canonicalPath: string
}

export interface PublicRouteResolutionRedirect {
  status: 'redirect'
  ref: EntityRef
  canonicalPath: string
}

export interface PublicRouteResolutionNotFound {
  status: 'notFound'
  scope: PublicDataScope
  slug: string
}

export type PublicRouteResolution =
  | PublicRouteResolutionOk
  | PublicRouteResolutionRedirect
  | PublicRouteResolutionNotFound

export interface PublicCatalogRecord {
  kind: EntityKind
  id: string
  name: string
  route: PublicRouteInfo
  assets?: Record<PublicAssetSlot, string>
  [key: string]: unknown
}

export interface PublicCatalog<TScope extends PublicDataScope = PublicDataScope> {
  schemaVersion: 3
  scope: TScope
  kind: EntityKind
  recordCount: number
  records: PublicCatalogRecord[]
}

export interface PublicRecord {
  schemaVersion: 3
  kind: EntityKind
  id: string
  name: string
  route?: PublicRouteInfo
  assets?: Record<PublicAssetSlot, string>
  [key: string]: unknown
}

export interface PublicManifestScope {
  kind: EntityKind
  catalog: string
  recordPattern: string
  count: number
}

export interface PublicScopeMetadata {
  scope: PublicDataScope
  kind: EntityKind
  idPrefix: string
  capabilities: string[]
  searchable: boolean
  recordCount: number
}

export interface PublicScopesIndex {
  schemaVersion: 3
  records: PublicScopeMetadata[]
  byScope: Record<PublicDataScope, PublicScopeMetadata>
}

export interface PublicManifest {
  schemaVersion: 3
  gameDataVersion: string
  generatedAt: string
  buildId: string
  scopes: Record<PublicDataScope, PublicManifestScope>
  indexes: Record<string, string>
  metadata?: Record<string, string>
  files?: Record<string, {bytes: number; sha256: string}>
}

export interface PublicEntitySummary extends EntityRef {
  name: string
  route?: PublicRouteInfo
  assets?: Record<PublicAssetSlot, string>
  [key: string]: unknown
}

export interface PublicEntitiesIndex {
  schemaVersion: 3
  byId: Record<string, PublicEntitySummary>
  scopes: Record<string, string[]>
}

export interface PublicRoutesIndex {
  schemaVersion: 3
  routes: Partial<Record<PublicDataScope, Record<string, PublicRouteIndexEntry>>>
  redirects: Partial<Record<PublicDataScope, Record<string, PublicRouteIndexEntry>>>
}

export interface PublicAssetAvailability {
  status: string
  path?: string
  candidates?: string[]
}

export interface PublicAssetRecord {
  id: string
  slot: PublicAssetSlot
  kind: EntityKind
  ownerId: string
  assetId?: string
  availability: PublicAssetAvailability
  [key: string]: unknown
}

export interface PublicAssetsIndex {
  schemaVersion: 3
  assets: Record<string, PublicAssetRecord>
  entities: Partial<Record<string, Record<PublicAssetSlot, string>>>
}

export interface PublicReferencesIndex {
  schemaVersion: 3
  tokens: Record<string, EntityRef[]>
  ambiguous: Record<string, EntityRef[]>
}

export interface PublicRelationshipsIndex {
  schemaVersion: 3
  forward: Record<string, Record<string, string[]>>
  reverse: Record<string, Record<string, string | string[]>>
}

export interface PublicSearchDocument extends EntityRef {
  name: string
  aliases: string[]
  tokens: string[]
  fields: Partial<Record<string, string[]>>
  facets?: Record<string, unknown>
}

export interface PublicSearchIndex {
  schemaVersion: 3
  scope: PublicDataScope
  records: PublicSearchDocument[]
}

export interface PublicBuilderCatalog {
  schemaVersion: 3
  options: Record<string, string[]>
  lineupTokens: Record<string, string>
  groups: Record<string, unknown>
}

export interface PublicCollectionCatalog {
  schemaVersion: 3
  collectables: Record<string, string[]>
  content: Record<string, unknown>
  groups: Record<string, unknown>
}
