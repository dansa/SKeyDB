/* oxlint-disable react/only-export-components */
import {lazy, type ReactNode} from 'react'

import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullRecord} from '@/domain/awakeners-full'
import {getCovenants, type Covenant} from '@/domain/covenants'
import type {CovenantFullRecord} from '@/domain/covenants-full'
import {buildDatabaseEntityBrowsePath, type DatabaseEntityId} from '@/domain/database-entity-paths'
import {
  buildDatabaseCovenantBrowsePath,
  buildDatabasePosseBrowsePath,
  buildDatabaseWheelBrowsePath,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityKind, EntityRef} from '@/domain/entities/types'
import {getPosses, type Posse} from '@/domain/posses'
import type {PosseFullRecord} from '@/domain/posses-full'
import type {PublicRelicRecord, Relic} from '@/domain/relics'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {preloadDatabaseDetailRecord as preloadDetailRecord} from '@/features/database/internal/useDatabaseDetailRouteRecord'

import type {
  DatabaseDetailResultNavigation,
  DatabaseDetailResultSelectRef,
} from './database-detail-result-navigation'

function loadAwakenerDetailModalModule() {
  return import('@/features/database/internal/AwakenerDetailModal')
}

function loadWheelDetailModalModule() {
  return import('@/features/database/internal/WheelDetailModal')
}

function loadSimpleArtifactDetailModalModule() {
  return import('@/features/database/internal/SimpleArtifactDetailModal')
}

function loadRelicDetailModalModule() {
  return import('@/features/database/internal/RelicDetailModal')
}

const AwakenerDetailModal = lazy(() =>
  loadAwakenerDetailModalModule().then((module) => ({
    default: module.AwakenerDetailModal,
  })),
)
const WheelDetailModal = lazy(() =>
  loadWheelDetailModalModule().then((module) => ({
    default: module.WheelDetailModal,
  })),
)
const SimpleArtifactDetailModal = lazy(() =>
  loadSimpleArtifactDetailModalModule().then((module) => ({
    default: module.SimpleArtifactDetailModal,
  })),
)
const RelicDetailModal = lazy(() =>
  loadRelicDetailModalModule().then((module) => ({default: module.RelicDetailModal})),
)

export type DatabaseDetailKind = Extract<
  EntityKind,
  'awakener' | 'wheel' | 'posse' | 'covenant' | 'relic'
>

export interface DatabaseDetailRenderCallbacks {
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel: (wheel: Pick<Wheel, 'id' | 'name'>) => void
  onSelectPosse: (posse: Pick<Posse, 'id' | 'name'>) => void
  onSelectCovenant: (covenant: Pick<Covenant, 'id' | 'name'>) => void
  onRelicVariantChange?: (variantId?: string) => void
  onSelectRelic?: (relic: Pick<Relic, 'id' | 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
}

export type DatabaseDetailRouteItem =
  | {kind: 'awakener'; item: Awakener; activeTab: DatabaseAwakenerTab}
  | {kind: 'wheel'; item: Wheel}
  | {kind: 'posse'; item: Posse}
  | {kind: 'covenant'; item: Covenant}
  | {kind: 'relic'; item: Relic; variantId?: string}

export type DatabaseDetailRouteItemByKind = {
  [Kind in DatabaseDetailKind]: Extract<DatabaseDetailRouteItem, {kind: Kind}>
}

export interface DatabaseDetailRecordByKind {
  awakener: AwakenerFullRecord
  wheel: WheelFullRecord
  posse: PosseFullRecord
  covenant: CovenantFullRecord
  relic: PublicRelicRecord
}

interface DatabaseDetailCatalogItemByKind {
  awakener: Awakener
  wheel: Wheel
  posse: Posse
  covenant: Covenant
  relic: Relic
}

interface DatabaseDetailCatalogIndex<Kind extends DatabaseDetailKind> {
  byId: Map<string, DatabaseDetailCatalogItemByKind[Kind]>
  byName: Map<string, DatabaseDetailCatalogItemByKind[Kind]>
}

export type DatabaseDetailCatalogLookup = {
  [Kind in DatabaseDetailKind]: DatabaseDetailCatalogIndex<Kind>
}

interface DatabaseDetailCatalogs {
  awakeners: readonly Awakener[]
  relics: readonly Relic[]
  wheels: readonly Wheel[]
}

interface DatabaseDetailRenderOptions<Kind extends DatabaseDetailKind> {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  item: DatabaseDetailRouteItemByKind[Kind]
  navigation: DatabaseDetailResultNavigation | null
  record: DatabaseDetailRecordByKind[Kind]
  wheels: Wheel[]
}

interface DatabaseDetailRegistryEntry<Kind extends DatabaseDetailKind> {
  createOverlayRouteItem: (
    lookup: DatabaseDetailCatalogLookup,
    id: string,
    activeAwakenerTab: DatabaseAwakenerTab,
  ) => DatabaseDetailRouteItemByKind[Kind] | null
  loadRecord: (id: string) => Promise<DatabaseDetailRecordByKind[Kind] | undefined>
  loadShell: () => Promise<unknown>
  loadingLabel: string
  loadingMaxWidth: 'standard' | 'wide'
  loadingSearchPlaceholder: string | null
  missingBrowsePath: string
  render: (options: DatabaseDetailRenderOptions<Kind>) => ReactNode
  resolveReference: (
    lookup: DatabaseDetailCatalogLookup,
    reference: {id?: string; name: string},
  ) => EntityRef | null
  selectResult: (
    callbacks: DatabaseDetailRenderCallbacks,
    ref: DatabaseDetailResultSelectRef,
    activeAwakenerTab: DatabaseAwakenerTab,
  ) => void
}

export type DatabaseDetailRegistry = {
  [Kind in DatabaseDetailKind]: DatabaseDetailRegistryEntry<Kind>
}

export function preloadDatabaseDetailShell(kind: DatabaseDetailKind): void {
  void dbDetailRegistry[kind].loadShell().catch(() => undefined)
}

export function preloadDatabaseDetail(kind: DatabaseDetailKind, id: string): void {
  preloadDatabaseDetailShell(kind)
  preloadDatabaseDetailRecordByKind(kind, id)
}

export function preloadDatabaseDetailRecordByKind(kind: DatabaseDetailKind, id: string): void {
  void preloadDetailRecord<DatabaseDetailRecordByKind[DatabaseDetailKind]>({
    id,
    loadRecord: dbDetailRegistry[kind].loadRecord,
  }).catch(() => undefined)
}

const DATABASE_DETAIL_KIND_BY_ENTITY = {
  awakeners: 'awakener',
  covenants: 'covenant',
  posses: 'posse',
  relics: 'relic',
  wheels: 'wheel',
} as const satisfies Record<DatabaseEntityId, DatabaseDetailKind>

export function getDatabaseDetailKindForEntity(entity: DatabaseEntityId): DatabaseDetailKind {
  return DATABASE_DETAIL_KIND_BY_ENTITY[entity]
}

function normalizeDetailName(name: string): string {
  return name.trim().toLowerCase()
}

function createCatalogIndex<Kind extends DatabaseDetailKind>(
  items: readonly DatabaseDetailCatalogItemByKind[Kind][],
): DatabaseDetailCatalogIndex<Kind> {
  const index: DatabaseDetailCatalogIndex<Kind> = {byId: new Map(), byName: new Map()}
  for (const item of items) {
    if (!index.byId.has(item.id)) index.byId.set(item.id, item)
    const normalizedName = normalizeDetailName(item.name)
    if (!index.byName.has(normalizedName)) index.byName.set(normalizedName, item)
  }
  return index
}

export function createDatabaseDetailCatalogLookup({
  awakeners,
  relics,
  wheels,
}: DatabaseDetailCatalogs): DatabaseDetailCatalogLookup {
  return {
    awakener: createCatalogIndex<'awakener'>(awakeners),
    covenant: createCatalogIndex<'covenant'>(getCovenants()),
    posse: createCatalogIndex<'posse'>(getPosses()),
    relic: createCatalogIndex<'relic'>(relics),
    wheel: createCatalogIndex<'wheel'>(wheels),
  }
}

function resolveCatalogReference(
  kind: DatabaseDetailKind,
  lookup: DatabaseDetailCatalogLookup,
  reference: {id?: string; name: string},
): EntityRef | null {
  const index = lookup[kind]
  const item =
    (reference.id ? index.byId.get(reference.id) : undefined) ??
    index.byName.get(normalizeDetailName(reference.name))
  return item ? {kind, id: item.id} : null
}

export function resolveDatabaseDetailOverlayRouteItem(
  ref: EntityRef & {kind: DatabaseDetailKind},
  lookup: DatabaseDetailCatalogLookup,
  activeAwakenerTab: DatabaseAwakenerTab,
): DatabaseDetailRouteItem | null {
  return dbDetailRegistry[ref.kind].createOverlayRouteItem(lookup, ref.id, activeAwakenerTab)
}

export function resolveDatabaseDetailReference(
  kind: DatabaseDetailKind,
  lookup: DatabaseDetailCatalogLookup,
  reference: {id?: string; name: string},
): EntityRef | null {
  return dbDetailRegistry[kind].resolveReference(lookup, reference)
}

export function selectDatabaseDetailResult(
  ref: DatabaseDetailResultSelectRef,
  callbacks: DatabaseDetailRenderCallbacks,
  activeAwakenerTab: DatabaseAwakenerTab,
): void {
  dbDetailRegistry[ref.kind].selectResult(callbacks, ref, activeAwakenerTab)
}

async function loadAwakenerDetailRecord(id: string) {
  const {loadPublicAwakenerDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicAwakenerDetailById(id)
}

async function loadWheelDetailRecord(id: string) {
  const {loadPublicWheelDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicWheelDetailById(id)
}

async function loadPosseDetailRecord(id: string) {
  const {loadPublicPosseDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicPosseDetailById(id)
}

async function loadCovenantDetailRecord(id: string) {
  const {loadPublicCovenantDetailById} = await import('@/domain/public-detail-record-adapters')

  return loadPublicCovenantDetailById(id)
}

async function loadRelicDetailRecord(id: string) {
  const {loadRelicRecordById} = await import('@/domain/relics')
  return loadRelicRecordById(id)
}

export const dbDetailRegistry: DatabaseDetailRegistry = {
  awakener: {
    createOverlayRouteItem: (lookup, id, activeTab) => {
      const item = lookup.awakener.byId.get(id)
      return item ? {kind: 'awakener', item, activeTab} : null
    },
    loadRecord: loadAwakenerDetailRecord,
    loadShell: loadAwakenerDetailModalModule,
    loadingLabel: 'Loading awakener details...',
    loadingMaxWidth: 'wide',
    loadingSearchPlaceholder: 'Jump to awakener…',
    missingBrowsePath: buildDatabaseEntityBrowsePath('awakeners'),
    render: ({awakeners, callbacks, item, navigation, record}) => {
      return (
        <AwakenerDetailModal
          activeTab={item.activeTab}
          awakener={item.item}
          awakeners={awakeners}
          fullData={record}
          key={item.item.id}
          navigation={navigation}
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
          onSelectCovenant={callbacks.onSelectCovenant}
          onSelectWheel={callbacks.onSelectWheel}
          onTabChange={callbacks.onTabChange}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('awakener', lookup, reference),
    selectResult: (callbacks, ref, activeAwakenerTab) => {
      callbacks.onSelectAwakener(ref, activeAwakenerTab)
    },
  },
  wheel: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.wheel.byId.get(id)
      return item ? {kind: 'wheel', item} : null
    },
    loadRecord: loadWheelDetailRecord,
    loadShell: loadWheelDetailModalModule,
    loadingLabel: 'Loading wheel details...',
    loadingMaxWidth: 'wide',
    loadingSearchPlaceholder: 'Jump to wheel…',
    missingBrowsePath: buildDatabaseWheelBrowsePath(),
    render: ({callbacks, item, navigation, record, wheels}) => {
      return (
        <WheelDetailModal
          fullData={record}
          key={item.item.id}
          navigation={navigation}
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
          onSelectWheel={callbacks.onSelectWheel}
          wheel={item.item}
          wheels={wheels}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('wheel', lookup, reference),
    selectResult: (callbacks, ref) => {
      callbacks.onSelectWheel(ref)
    },
  },
  posse: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.posse.byId.get(id)
      return item ? {kind: 'posse', item} : null
    },
    loadRecord: loadPosseDetailRecord,
    loadShell: loadSimpleArtifactDetailModalModule,
    loadingLabel: 'Loading posse details...',
    loadingMaxWidth: 'standard',
    loadingSearchPlaceholder: null,
    missingBrowsePath: buildDatabasePosseBrowsePath(),
    render: ({callbacks, item, navigation, record}) => {
      return (
        <SimpleArtifactDetailModal
          fullData={record}
          item={item.item}
          kind='posse'
          navigation={navigation}
          onClose={callbacks.onClose}
          onSelectAwakener={callbacks.onSelectAwakener}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('posse', lookup, reference),
    selectResult: (callbacks, ref) => {
      callbacks.onSelectPosse(ref)
    },
  },
  covenant: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.covenant.byId.get(id)
      return item ? {kind: 'covenant', item} : null
    },
    loadRecord: loadCovenantDetailRecord,
    loadShell: loadSimpleArtifactDetailModalModule,
    loadingLabel: 'Loading covenant details...',
    loadingMaxWidth: 'standard',
    loadingSearchPlaceholder: null,
    missingBrowsePath: buildDatabaseCovenantBrowsePath(),
    render: ({callbacks, item, navigation, record}) => {
      return (
        <SimpleArtifactDetailModal
          fullData={record}
          item={item.item}
          kind='covenant'
          navigation={navigation}
          onClose={callbacks.onClose}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('covenant', lookup, reference),
    selectResult: (callbacks, ref) => {
      callbacks.onSelectCovenant(ref)
    },
  },
  relic: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.relic.byId.get(id)
      return item ? {kind: 'relic', item} : null
    },
    loadRecord: loadRelicDetailRecord,
    loadShell: loadRelicDetailModalModule,
    loadingLabel: 'Loading relic details...',
    loadingMaxWidth: 'standard',
    loadingSearchPlaceholder: null,
    missingBrowsePath: buildDatabaseEntityBrowsePath('relics'),
    render: ({callbacks, item, navigation, record}) => (
      <RelicDetailModal
        fullData={record}
        item={item.item}
        navigation={navigation}
        onClose={callbacks.onClose}
        onRelicVariantChange={callbacks.onRelicVariantChange}
        onSelectAwakener={callbacks.onSelectAwakener}
        selectedVariantId={item.variantId}
      />
    ),
    resolveReference: (lookup, reference) => resolveCatalogReference('relic', lookup, reference),
    selectResult: (callbacks, ref) => {
      callbacks.onSelectRelic?.(ref)
    },
  },
}
