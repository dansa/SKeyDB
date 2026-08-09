/* oxlint-disable react/only-export-components -- This registry intentionally colocates lazy detail components with the non-component routing and preload API that owns them. */
import {lazy, type ReactNode} from 'react'

import {getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerFullRecord} from '@/domain/awakeners-full'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import {getCovenants, type Covenant} from '@/domain/covenants'
import type {CovenantFullRecord} from '@/domain/covenants-full'
import {
  DATABASE_ENTITY_DEFINITIONS,
  getDatabaseDetailKindForEntity,
  type DatabaseDetailKind,
} from '@/domain/database-entity-definitions'
import {buildDatabaseEntityBrowsePath} from '@/domain/database-entity-paths'
import {
  buildDatabaseCovenantBrowsePath,
  buildDatabasePosseBrowsePath,
  buildDatabaseWheelBrowsePath,
  DEFAULT_DATABASE_AWAKENER_TAB,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getPosseAssetById} from '@/domain/posse-assets'
import {getPosses, type Posse} from '@/domain/posses'
import type {PosseFullRecord} from '@/domain/posses-full'
import {getRelicAssetByAssetId} from '@/domain/relic-assets'
import type {PublicRelicRecord, Relic} from '@/domain/relics'
import {getWheelMiniAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'
import type {WheelFullRecord} from '@/domain/wheels-full'
import {preloadDatabaseDetailRecord as preloadDetailRecord} from '@/features/database/internal/useDatabaseDetailRouteRecord'

import type {
  DatabaseDetailResultNavigation,
  DatabaseDetailResultSelectRef,
  DatabaseDetailResultSet,
  DatabaseDetailResultSetItem,
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

export type {DatabaseDetailKind} from '@/domain/database-entity-definitions'

export type DatabaseDetailNavigationState = Readonly<
  | {tab: DatabaseAwakenerTab; variant?: never}
  | {tab?: never; variant: string | undefined}
  | {tab?: never; variant?: never}
>

/** Generic navigation boundary shared by route-backed and owner-scoped overlay details. */
export interface DatabaseDetailNavigationPort {
  close: () => void
  select: (ref: EntityRef, state?: DatabaseDetailNavigationState) => void
  updateState: (state: DatabaseDetailNavigationState) => void
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
  items: readonly DatabaseDetailCatalogItemByKind[Kind][]
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
  item: DatabaseDetailRouteItemByKind[Kind]
  lookup: DatabaseDetailCatalogLookup
  navigation: DatabaseDetailResultNavigation | null
  navigationPort: DatabaseDetailNavigationPort
  record: DatabaseDetailRecordByKind[Kind]
}

interface DatabaseDetailRegistryEntry<Kind extends DatabaseDetailKind> {
  createOverlayRouteItem: (
    lookup: DatabaseDetailCatalogLookup,
    id: string,
    state: DatabaseDetailNavigationState,
  ) => DatabaseDetailRouteItemByKind[Kind] | null
  getCatalogItems: (
    catalogs: DatabaseDetailCatalogs,
  ) => readonly DatabaseDetailCatalogItemByKind[Kind][]
  loadRecord: (id: string) => Promise<DatabaseDetailRecordByKind[Kind] | undefined>
  loadShell: () => Promise<unknown>
  loadingLabel: string
  loadingMaxWidth: 'standard' | 'wide'
  loadingSearchPlaceholder: string | null
  missingBrowsePath: string
  presentResult: (item: DatabaseDetailCatalogItemByKind[Kind]) => DatabaseDetailResultSetItem
  render: (options: DatabaseDetailRenderOptions<Kind>) => ReactNode
  resolveReference: (
    lookup: DatabaseDetailCatalogLookup,
    reference: {id?: string; name: string},
  ) => EntityRef | null
  selectResult: (
    navigation: DatabaseDetailNavigationPort,
    ref: DatabaseDetailResultSelectRef,
    item: DatabaseDetailRouteItem,
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

export {getDatabaseDetailKindForEntity}

function normalizeDetailName(name: string): string {
  return name.trim().toLowerCase()
}

function createCatalogIndex<Kind extends DatabaseDetailKind>(
  items: readonly DatabaseDetailCatalogItemByKind[Kind][],
): DatabaseDetailCatalogIndex<Kind> {
  const index: DatabaseDetailCatalogIndex<Kind> = {byId: new Map(), byName: new Map(), items}
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
  const catalogs = {awakeners, relics, wheels}
  return Object.fromEntries(
    DATABASE_ENTITY_DEFINITIONS.map(({detailKind}) => [
      detailKind,
      createCatalogIndex(dbDetailRegistry[detailKind].getCatalogItems(catalogs)),
    ]),
  ) as DatabaseDetailCatalogLookup
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
  state: DatabaseDetailNavigationState = {},
): DatabaseDetailRouteItem | null {
  return dbDetailRegistry[ref.kind].createOverlayRouteItem(lookup, ref.id, state)
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
  navigation: DatabaseDetailNavigationPort,
  item: DatabaseDetailRouteItem,
): void {
  if (ref.kind !== item.kind) return
  dbDetailRegistry[ref.kind].selectResult(navigation, ref, item)
}

export function createDatabaseDetailResultSet<Kind extends DatabaseDetailKind>(
  kind: Kind,
  items: readonly DatabaseDetailCatalogItemByKind[Kind][],
): DatabaseDetailResultSet {
  return {kind, items: items.map(dbDetailRegistry[kind].presentResult)}
}

function selectReference(
  kind: DatabaseDetailKind,
  lookup: DatabaseDetailCatalogLookup,
  navigation: DatabaseDetailNavigationPort,
  reference: {id?: string; name: string},
  state?: DatabaseDetailNavigationState,
): void {
  const ref = resolveCatalogReference(kind, lookup, reference)
  if (ref) navigation.select(ref, state)
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
    createOverlayRouteItem: (lookup, id, state) => {
      const item = lookup.awakener.byId.get(id)
      return item
        ? {kind: 'awakener', item, activeTab: state.tab ?? DEFAULT_DATABASE_AWAKENER_TAB}
        : null
    },
    getCatalogItems: ({awakeners}) => awakeners,
    loadRecord: loadAwakenerDetailRecord,
    loadShell: loadAwakenerDetailModalModule,
    loadingLabel: 'Loading awakener details...',
    loadingMaxWidth: 'wide',
    loadingSearchPlaceholder: 'Jump to awakener…',
    missingBrowsePath: buildDatabaseEntityBrowsePath('awakeners'),
    presentResult: (awakener) => ({
      id: awakener.id,
      imageSrc: getAwakenerPortraitAsset(awakener.name),
      name: formatAwakenerNameForUi(awakener.name),
    }),
    render: ({item, lookup, navigation, navigationPort, record}) => {
      return (
        <AwakenerDetailModal
          activeTab={item.activeTab}
          awakener={item.item}
          awakeners={[...lookup.awakener.items]}
          fullData={record}
          key={item.item.id}
          navigation={navigation}
          onClose={navigationPort.close}
          onSelectAwakener={(awakener, tab) => {
            selectReference('awakener', lookup, navigationPort, awakener, {tab})
          }}
          onSelectCovenant={(covenant) => {
            selectReference('covenant', lookup, navigationPort, covenant)
          }}
          onSelectWheel={(wheel) => {
            selectReference('wheel', lookup, navigationPort, wheel)
          }}
          onTabChange={(tab) => {
            navigationPort.updateState({tab})
          }}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('awakener', lookup, reference),
    selectResult: (navigation, ref, item) => {
      navigation.select(ref, item.kind === 'awakener' ? {tab: item.activeTab} : undefined)
    },
  },
  wheel: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.wheel.byId.get(id)
      return item ? {kind: 'wheel', item} : null
    },
    getCatalogItems: ({wheels}) => wheels,
    loadRecord: loadWheelDetailRecord,
    loadShell: loadWheelDetailModalModule,
    loadingLabel: 'Loading wheel details...',
    loadingMaxWidth: 'wide',
    loadingSearchPlaceholder: 'Jump to wheel…',
    missingBrowsePath: buildDatabaseWheelBrowsePath(),
    presentResult: (wheel) => ({
      id: wheel.id,
      imageSrc: getWheelMiniAssetById(wheel.id),
      imageTreatment: 'icon',
      name: wheel.name,
    }),
    render: ({item, lookup, navigation, navigationPort, record}) => {
      return (
        <WheelDetailModal
          fullData={record}
          key={item.item.id}
          navigation={navigation}
          onClose={navigationPort.close}
          onSelectAwakener={(awakener) => {
            selectReference('awakener', lookup, navigationPort, awakener)
          }}
          onSelectWheel={(wheel) => {
            selectReference('wheel', lookup, navigationPort, wheel)
          }}
          wheel={item.item}
          wheels={[...lookup.wheel.items]}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('wheel', lookup, reference),
    selectResult: (navigation, ref) => {
      navigation.select(ref)
    },
  },
  posse: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.posse.byId.get(id)
      return item ? {kind: 'posse', item} : null
    },
    getCatalogItems: () => getPosses(),
    loadRecord: loadPosseDetailRecord,
    loadShell: loadSimpleArtifactDetailModalModule,
    loadingLabel: 'Loading posse details...',
    loadingMaxWidth: 'standard',
    loadingSearchPlaceholder: null,
    missingBrowsePath: buildDatabasePosseBrowsePath(),
    presentResult: (posse) => ({
      id: posse.id,
      imageSrc: getPosseAssetById(posse.id),
      imageTreatment: 'icon',
      name: posse.name,
    }),
    render: ({item, lookup, navigation, navigationPort, record}) => {
      return (
        <SimpleArtifactDetailModal
          fullData={record}
          item={item.item}
          kind='posse'
          navigation={navigation}
          onClose={navigationPort.close}
          onSelectAwakener={(awakener) => {
            selectReference('awakener', lookup, navigationPort, awakener)
          }}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('posse', lookup, reference),
    selectResult: (navigation, ref) => {
      navigation.select(ref)
    },
  },
  covenant: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.covenant.byId.get(id)
      return item ? {kind: 'covenant', item} : null
    },
    getCatalogItems: () => getCovenants(),
    loadRecord: loadCovenantDetailRecord,
    loadShell: loadSimpleArtifactDetailModalModule,
    loadingLabel: 'Loading covenant details...',
    loadingMaxWidth: 'standard',
    loadingSearchPlaceholder: null,
    missingBrowsePath: buildDatabaseCovenantBrowsePath(),
    presentResult: (covenant) => ({
      id: covenant.id,
      imageSrc: getCovenantAssetById(covenant.id),
      imageTreatment: 'covenant-icon',
      name: covenant.name,
    }),
    render: ({item, navigation, navigationPort, record}) => {
      return (
        <SimpleArtifactDetailModal
          fullData={record}
          item={item.item}
          kind='covenant'
          navigation={navigation}
          onClose={navigationPort.close}
        />
      )
    },
    resolveReference: (lookup, reference) => resolveCatalogReference('covenant', lookup, reference),
    selectResult: (navigation, ref) => {
      navigation.select(ref)
    },
  },
  relic: {
    createOverlayRouteItem: (lookup, id) => {
      const item = lookup.relic.byId.get(id)
      return item ? {kind: 'relic', item} : null
    },
    getCatalogItems: ({relics}) => relics,
    loadRecord: loadRelicDetailRecord,
    loadShell: loadRelicDetailModalModule,
    loadingLabel: 'Loading relic details...',
    loadingMaxWidth: 'standard',
    loadingSearchPlaceholder: null,
    missingBrowsePath: buildDatabaseEntityBrowsePath('relics'),
    presentResult: (relic) => ({
      id: relic.id,
      imageSrc: getRelicAssetByAssetId(relic.assetId),
      imageTreatment: 'icon',
      name: relic.name,
    }),
    render: ({item, lookup, navigation, navigationPort, record}) => (
      <RelicDetailModal
        fullData={record}
        item={item.item}
        navigation={navigation}
        onClose={navigationPort.close}
        onRelicVariantChange={(variantId) => {
          navigationPort.updateState({variant: variantId})
        }}
        onSelectAwakener={(awakener) => {
          selectReference('awakener', lookup, navigationPort, awakener)
        }}
        selectedVariantId={item.variantId}
      />
    ),
    resolveReference: (lookup, reference) => resolveCatalogReference('relic', lookup, reference),
    selectResult: (navigation, ref) => {
      navigation.select(ref)
    },
  },
}

const expectedDetailKinds = DATABASE_ENTITY_DEFINITIONS.map(({detailKind}) => detailKind).sort()
const registeredDetailKinds = Object.keys(dbDetailRegistry).sort()
if (expectedDetailKinds.join('\u0000') !== registeredDetailKinds.join('\u0000')) {
  throw new Error(
    `Database detail registry coverage mismatch: expected ${expectedDetailKinds.join(', ')}, received ${registeredDetailKinds.join(', ')}`,
  )
}
