import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'

import {FaMagnifyingGlass, FaXmark} from 'react-icons/fa6'
import {Navigate, useLocation, useNavigate} from 'react-router-dom'

import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import {
  buildDatabaseAwakenerPath,
  DEFAULT_DATABASE_AWAKENER_TAB,
  resolveDatabaseAwakenerTab,
  resolveDatabaseAwakenerVisibleTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import type {Relic} from '@/domain/relics'
import type {Wheel} from '@/domain/wheels'
import {
  useDatabaseDetailRecord,
  useDatabaseDetailRouteRecord,
} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {dbDetailStore, type DbDetailStackEntry} from '@/stores/dbDetailStore'

import {
  createDatabaseDetailResultNavigation,
  type DatabaseDetailResultNavigation,
  type DatabaseDetailResultSelectRef,
  type DatabaseDetailResultSet,
} from './database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from './DatabaseDetailResultNavigator'
import {DbDetailModalFrame} from './DbDetailModalFrame'
import {
  createDatabaseDetailCatalogLookup,
  dbDetailRegistry,
  preloadDatabaseDetailRecordByKind,
  resolveDatabaseDetailOverlayRouteItem,
  resolveDatabaseDetailReference,
  selectDatabaseDetailResult,
  type DatabaseDetailKind,
  type DatabaseDetailRecordByKind,
  type DatabaseDetailRenderCallbacks,
  type DatabaseDetailRouteItem,
  type DatabaseDetailRouteItemByKind,
} from './dbDetailRegistry'
import {resolveRelicDetailRoutePolicy} from './relic-detail-route-policy'

type DatabaseDetailRef = EntityRef & {kind: DatabaseDetailKind}
const EMPTY_RELICS: readonly Relic[] = []

interface OverlayAwakenerTabState {
  activeTab: DatabaseAwakenerTab
  refKey: string
}

interface DbDetailModalHostProps {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  resultSet?: DatabaseDetailResultSet | null
  routeItem: DatabaseDetailRouteItem | null
  relics?: readonly Relic[]
  tabSlug?: string
  wheels: Wheel[]
}

function useDbDetailStackTop(): DbDetailStackEntry | null {
  return useSyncExternalStore(
    dbDetailStore.subscribe,
    () => dbDetailStore.getState().stack.at(-1) ?? null,
    () => dbDetailStore.getState().stack.at(-1) ?? null,
  )
}

function isDatabaseDetailKind(kind: EntityRef['kind']): kind is DatabaseDetailKind {
  return kind in dbDetailRegistry
}

function resolveOverlayAwakenerTab(
  activeRefKey: string,
  state: OverlayAwakenerTabState,
): DatabaseAwakenerTab {
  return state.refKey === activeRefKey ? state.activeTab : DEFAULT_DATABASE_AWAKENER_TAB
}

function resolveAwakenerTabCanonicalPath(
  awakener: Awakener,
  tabSlug: string | undefined,
): string | null {
  if (!tabSlug) {
    return null
  }

  const resolvedTab = resolveDatabaseAwakenerVisibleTab(resolveDatabaseAwakenerTab(tabSlug))
  return buildDatabaseAwakenerPath(awakener, resolvedTab)
}

function preloadDatabaseDetailResult(ref: DatabaseDetailResultSelectRef) {
  preloadDatabaseDetailRecordByKind(ref.kind, ref.id)
}

type IdlePreloadWindow = Window & {
  cancelIdleCallback?: (handle: number) => void
  requestIdleCallback?: (
    callback: (deadline: {didTimeout: boolean; timeRemaining: () => number}) => void,
    options?: {timeout?: number},
  ) => number
}

const NEIGHBOR_PRELOAD_IDLE_TIMEOUT_MS = 1200
const NEIGHBOR_PRELOAD_FALLBACK_DELAY_MS = 150

function scheduleDatabaseDetailResultPreload(ref: DatabaseDetailResultSelectRef): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const idleWindow = window as Partial<IdlePreloadWindow>
  if (idleWindow.requestIdleCallback) {
    const handle = idleWindow.requestIdleCallback(
      () => {
        preloadDatabaseDetailResult(ref)
      },
      {timeout: NEIGHBOR_PRELOAD_IDLE_TIMEOUT_MS},
    )
    return () => {
      idleWindow.cancelIdleCallback?.(handle)
    }
  }

  const timeout = window.setTimeout(() => {
    preloadDatabaseDetailResult(ref)
  }, NEIGHBOR_PRELOAD_FALLBACK_DELAY_MS)

  return () => {
    window.clearTimeout(timeout)
  }
}

function useDeferredDatabaseDetailNeighborPreload(
  navigation: DatabaseDetailResultNavigation | null,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !navigation) {
      return
    }

    const cancelPreloads: (() => void)[] = []
    if (navigation.previous) {
      cancelPreloads.push(scheduleDatabaseDetailResultPreload(navigation.previous.ref))
    }
    if (navigation.next) {
      cancelPreloads.push(scheduleDatabaseDetailResultPreload(navigation.next.ref))
    }

    return () => {
      for (const cancelPreload of cancelPreloads) {
        cancelPreload()
      }
    }
  }, [enabled, navigation])
}

interface DbDetailRouteLoadingModalProps {
  loadingLabel: string
  navigation: DatabaseDetailResultNavigation | null
  onClose: () => void
  routeItem: DatabaseDetailRouteItem
}

function DbDetailRouteLoadingModal({
  loadingLabel,
  navigation,
  onClose,
  routeItem,
}: DbDetailRouteLoadingModalProps) {
  const itemName = routeItem.item.name
  const registryEntry = dbDetailRegistry[routeItem.kind]
  const searchPlaceholderLabel = registryEntry.loadingSearchPlaceholder

  return (
    <DbDetailModalFrame
      ariaLabel={`${itemName} details`}
      header={
        <>
          {searchPlaceholderLabel ? (
            <div
              aria-hidden
              className='flex shrink-0 items-center gap-2 border border-amber-200/18 bg-slate-950/[.96] px-3 py-2 text-sm text-slate-500 shadow-[0_12px_26px_rgba(2,6,23,0.45)]'
              data-detail-modal-external=''
            >
              <FaMagnifyingGlass className='size-3.5 shrink-0' />
              <span>{searchPlaceholderLabel}</span>
            </div>
          ) : null}
          <DatabaseDetailResultNavigator navigation={navigation} />
        </>
      }
      maxWidth={registryEntry.loadingMaxWidth}
      onOverlayClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        aria-busy='true'
        className='relative flex min-h-[16rem] min-w-0 items-center justify-center overflow-hidden border border-amber-200/55 bg-slate-950/[.985] px-6 py-12 text-center shadow-[0_24px_70px_rgba(2,6,23,0.8)]'
      >
        <button
          aria-label={`Close ${routeItem.kind} detail`}
          className='absolute top-3 right-3 inline-flex size-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
          onClick={onClose}
          type='button'
        >
          <FaXmark className='size-4' />
        </button>
        <div>
          <div className='ui-title text-lg text-amber-100'>{itemName}</div>
          <output className='mt-3 block text-sm text-slate-400'>{loadingLabel}</output>
        </div>
      </div>
    </DbDetailModalFrame>
  )
}

export function DbDetailModalHost({
  awakeners,
  callbacks,
  relics = EMPTY_RELICS,
  resultSet = null,
  routeItem,
  tabSlug,
  wheels,
}: DbDetailModalHostProps) {
  const stackTop = useDbDetailStackTop()
  const activeRef: DatabaseDetailRef | null = routeItem
    ? {kind: routeItem.kind, id: routeItem.item.id}
    : stackTop?.source !== 'database-route' && stackTop?.kind && isDatabaseDetailKind(stackTop.kind)
      ? {kind: stackTop.kind, id: stackTop.id}
      : null
  const activeAwakenerTab =
    routeItem?.kind === 'awakener' ? routeItem.activeTab : DEFAULT_DATABASE_AWAKENER_TAB
  const routeNavigation = useMemo(
    () =>
      createDatabaseDetailResultNavigation({
        currentRef: routeItem ? {kind: routeItem.kind, id: routeItem.item.id} : null,
        onSelect: (ref) => {
          selectDatabaseDetailResult(ref, callbacks, activeAwakenerTab)
        },
        resultSet,
      }),
    [activeAwakenerTab, callbacks, resultSet, routeItem],
  )

  useEffect(() => {
    dbDetailStore
      .getState()
      .syncFromRoute(routeItem ? {kind: routeItem.kind, id: routeItem.item.id} : null)
  }, [routeItem])

  if (!routeItem || activeRef?.kind !== routeItem.kind) {
    if (!routeItem && activeRef) {
      return (
        <Suspense
          fallback={<div className='px-2 py-3 text-sm text-slate-300'>Loading details…</div>}
        >
          <DbDetailOverlayModal
            activeRef={activeRef}
            awakeners={awakeners}
            callbacks={callbacks}
            relics={relics}
            wheels={wheels}
          />
        </Suspense>
      )
    }
    return null
  }

  return (
    <Suspense
      fallback={
        <DbDetailRouteLoadingModal
          loadingLabel={dbDetailRegistry[routeItem.kind].loadingLabel}
          navigation={routeNavigation}
          onClose={callbacks.onClose}
          routeItem={routeItem}
        />
      }
    >
      <DbDetailRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        navigation={routeNavigation}
        routeItem={routeItem}
        tabSlug={tabSlug}
        wheels={wheels}
      />
    </Suspense>
  )
}

interface DbDetailOverlayModalProps {
  activeRef: DatabaseDetailRef
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  relics: readonly Relic[]
  wheels: Wheel[]
}

function DbDetailOverlayModal({
  activeRef,
  awakeners,
  callbacks,
  relics,
  wheels,
}: DbDetailOverlayModalProps) {
  const activeRefKey = `${activeRef.kind}:${activeRef.id}`
  const [overlayAwakenerTabState, setOverlayAwakenerTabState] = useState<OverlayAwakenerTabState>(
    () => ({
      activeTab: DEFAULT_DATABASE_AWAKENER_TAB,
      refKey: activeRefKey,
    }),
  )
  // Overlay refs can outlive the current public catalog; stale refs are pruned below.
  const overlayAwakenerTab = resolveOverlayAwakenerTab(activeRefKey, overlayAwakenerTabState)
  const detailRefLookup = useMemo(
    () => createDatabaseDetailCatalogLookup({awakeners, relics, wheels}),
    [awakeners, relics, wheels],
  )
  const routeItem = resolveDatabaseDetailOverlayRouteItem(
    activeRef,
    detailRefLookup,
    overlayAwakenerTab,
  )

  useEffect(() => {
    if (!routeItem) {
      dbDetailStore.getState().popDetail()
    }
  }, [routeItem])

  const onClose = useCallback(() => {
    dbDetailStore.getState().popDetail()
  }, [])
  const onTabChange = useCallback(
    (nextTab: DatabaseAwakenerTab) => {
      setOverlayAwakenerTabState({activeTab: nextTab, refKey: activeRefKey})
    },
    [activeRefKey],
  )
  const onSelectAwakener = useCallback(
    (awakener: Pick<Awakener, 'id' | 'name'>) => {
      const ref = resolveDatabaseDetailReference('awakener', detailRefLookup, awakener)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    [detailRefLookup],
  )
  const onSelectWheel = useCallback(
    (wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>) => {
      const ref = resolveDatabaseDetailReference('wheel', detailRefLookup, wheel)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    [detailRefLookup],
  )
  const onSelectCovenant = useCallback(
    (covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>) => {
      const ref = resolveDatabaseDetailReference('covenant', detailRefLookup, covenant)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    [detailRefLookup],
  )
  const overlayCallbacks = useMemo<DatabaseDetailRenderCallbacks>(
    () => ({
      ...callbacks,
      onClose,
      onSelectAwakener,
      onSelectCovenant,
      onSelectWheel,
      onTabChange,
    }),
    [callbacks, onClose, onSelectAwakener, onSelectCovenant, onSelectWheel, onTabChange],
  )

  if (!routeItem) {
    return null
  }

  return (
    <DbDetailOverlayModalContent
      awakeners={awakeners}
      callbacks={overlayCallbacks}
      id={activeRef.id}
      kind={routeItem.kind}
      routeItem={routeItem}
      wheels={wheels}
    />
  )
}

interface DbDetailOverlayModalContentProps<Kind extends DatabaseDetailKind> {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  id: string
  kind: Kind
  routeItem: DatabaseDetailRouteItemByKind[Kind]
  wheels: Wheel[]
}

function DbDetailOverlayModalContent<Kind extends DatabaseDetailKind>({
  awakeners,
  callbacks,
  id,
  kind,
  routeItem,
  wheels,
}: DbDetailOverlayModalContentProps<Kind>) {
  // Public detail records can disappear between overlay open and async load completion.
  const registryEntry = dbDetailRegistry[kind]
  const {isLoading, record} = useDatabaseDetailRecord({id, loadRecord: registryEntry.loadRecord})

  useEffect(() => {
    if (!isLoading && !record) {
      dbDetailStore.getState().popDetail()
    }
  }, [isLoading, record])

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>{registryEntry.loadingLabel}</div>
  }

  if (!record) {
    return null
  }

  return registryEntry.render({
    awakeners,
    callbacks,
    item: routeItem,
    navigation: null,
    record,
    wheels,
  })
}

interface DbDetailRouteModalProps {
  activeRef: EntityRef
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  navigation: DatabaseDetailResultNavigation | null
  routeItem: DatabaseDetailRouteItem
  tabSlug?: string
  wheels: Wheel[]
}

function DbDetailRouteModal({
  activeRef,
  awakeners,
  callbacks,
  navigation,
  routeItem,
  tabSlug,
  wheels,
}: DbDetailRouteModalProps) {
  if (routeItem.kind === 'awakener') {
    return (
      <DbDetailAwakenerRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        navigation={navigation}
        routeItem={routeItem}
        tabSlug={tabSlug}
        wheels={wheels}
      />
    )
  }
  if (routeItem.kind === 'relic') {
    return (
      <DbDetailRelicRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        navigation={navigation}
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  return (
    <DbDetailNonAwakenerRouteModal
      activeRef={activeRef}
      awakeners={awakeners}
      callbacks={callbacks}
      kind={routeItem.kind}
      navigation={navigation}
      routeItem={routeItem}
      wheels={wheels}
    />
  )
}

interface DbDetailKindRouteModalProps<Kind extends DatabaseDetailKind> {
  activeRef: EntityRef
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  navigation: DatabaseDetailResultNavigation | null
  routeItem: DatabaseDetailRouteItemByKind[Kind]
  tabSlug?: string
  wheels: Wheel[]
}

interface DbDetailNonAwakenerRouteModalProps<
  Kind extends Exclude<DatabaseDetailKind, 'awakener' | 'relic'>,
> extends DbDetailKindRouteModalProps<Kind> {
  kind: Kind
}

interface DbDetailRouteRecordBoundaryProps<Kind extends Exclude<DatabaseDetailKind, 'awakener'>> {
  activeRef: EntityRef
  callbacks: DatabaseDetailRenderCallbacks
  children: (record: DatabaseDetailRecordByKind[Kind]) => ReactNode
  kind: Kind
  navigation: DatabaseDetailResultNavigation | null
  routeItem: DatabaseDetailRouteItemByKind[Kind]
}

function DbDetailRouteRecordBoundary<Kind extends Exclude<DatabaseDetailKind, 'awakener'>>({
  activeRef,
  callbacks,
  children,
  kind,
  navigation,
  routeItem,
}: DbDetailRouteRecordBoundaryProps<Kind>) {
  const registryEntry = dbDetailRegistry[kind]
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })
  useDeferredDatabaseDetailNeighborPreload(navigation, Boolean(record))

  if (isLoading) {
    return (
      <DbDetailRouteLoadingModal
        loadingLabel={registryEntry.loadingLabel}
        navigation={navigation}
        onClose={callbacks.onClose}
        routeItem={routeItem}
      />
    )
  }

  return record ? children(record) : null
}

function DbDetailAwakenerRouteModal({
  activeRef,
  awakeners,
  callbacks,
  navigation,
  routeItem,
  tabSlug,
  wheels,
}: DbDetailKindRouteModalProps<'awakener'>) {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const registryEntry = dbDetailRegistry.awakener
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })
  const canonicalTabPath = resolveAwakenerTabCanonicalPath(routeItem.item, tabSlug)
  useDeferredDatabaseDetailNeighborPreload(navigation, Boolean(record))

  useEffect(() => {
    if (!record || !canonicalTabPath || routerLocation.pathname === canonicalTabPath) {
      return
    }

    void navigate(
      {
        pathname: canonicalTabPath,
        search: routerLocation.search,
      },
      {replace: true},
    )
  }, [canonicalTabPath, navigate, record, routerLocation.pathname, routerLocation.search])

  if (isLoading) {
    return (
      <DbDetailRouteLoadingModal
        loadingLabel={registryEntry.loadingLabel}
        navigation={navigation}
        onClose={callbacks.onClose}
        routeItem={routeItem}
      />
    )
  }

  if (!record) {
    return null
  }

  return registryEntry.render({
    awakeners,
    callbacks,
    item: routeItem,
    navigation,
    record,
    wheels,
  })
}

function DbDetailNonAwakenerRouteModal<
  Kind extends Exclude<DatabaseDetailKind, 'awakener' | 'relic'>,
>({
  activeRef,
  awakeners,
  callbacks,
  kind,
  navigation,
  routeItem,
  wheels,
}: DbDetailNonAwakenerRouteModalProps<Kind>) {
  const registryEntry = dbDetailRegistry[kind]
  return (
    <DbDetailRouteRecordBoundary
      activeRef={activeRef}
      callbacks={callbacks}
      kind={kind}
      navigation={navigation}
      routeItem={routeItem}
    >
      {(record) =>
        registryEntry.render({
          awakeners,
          callbacks,
          item: routeItem,
          navigation,
          record,
          wheels,
        })
      }
    </DbDetailRouteRecordBoundary>
  )
}

function DbDetailRelicRouteModal({
  activeRef,
  awakeners,
  callbacks,
  navigation,
  routeItem,
  wheels,
}: DbDetailKindRouteModalProps<'relic'>) {
  const location = useLocation()
  const registryEntry = dbDetailRegistry.relic
  return (
    <DbDetailRouteRecordBoundary
      activeRef={activeRef}
      callbacks={callbacks}
      kind='relic'
      navigation={navigation}
      routeItem={routeItem}
    >
      {(record) => {
        const resolution = resolveRelicDetailRoutePolicy({location, record, routeItem})

        return (
          <>
            {resolution.replaceTarget ? <Navigate replace to={resolution.replaceTarget} /> : null}
            {registryEntry.render({
              awakeners,
              callbacks,
              item: resolution.renderItem,
              navigation,
              record,
              wheels,
            })}
          </>
        )
      }}
    </DbDetailRouteRecordBoundary>
  )
}
