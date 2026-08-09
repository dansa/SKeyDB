import {Suspense, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode} from 'react'

import {FaMagnifyingGlass, FaXmark} from 'react-icons/fa6'
import {Navigate, useLocation, useNavigate} from 'react-router'

import type {Awakener} from '@/domain/awakeners'
import {getAwakeners} from '@/domain/awakeners'
import {
  buildDatabaseAwakenerPath,
  DEFAULT_DATABASE_AWAKENER_TAB,
  resolveDatabaseAwakenerTab,
  resolveDatabaseAwakenerVisibleTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import type {Relic} from '@/domain/relics'
import {getRelics} from '@/domain/relics'
import type {Wheel} from '@/domain/wheels'
import {getWheels} from '@/domain/wheels'
import {
  useDatabaseDetailRecord,
  useDatabaseDetailRouteRecord,
} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import type {DatabaseDetailOverlaySession} from '@/stores/dbDetailStore'

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
  selectDatabaseDetailResult,
  type DatabaseDetailKind,
  type DatabaseDetailCatalogLookup,
  type DatabaseDetailNavigationPort,
  type DatabaseDetailRecordByKind,
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

export interface DbDetailModalHostProps {
  awakeners: Awakener[]
  navigationPort?: DatabaseDetailNavigationPort
  overlaySession?: DatabaseDetailOverlaySession
  resultSet?: DatabaseDetailResultSet | null
  routeItem: DatabaseDetailRouteItem | null
  relics?: readonly Relic[]
  tabSlug?: string
  wheels: Wheel[]
}

export interface DatabaseDetailOverlayOutletProps {
  session: DatabaseDetailOverlaySession
}

/** Renders one owner's overlay branch without exposing route callback plumbing. */
export function DatabaseDetailOverlayOutlet(props: DatabaseDetailOverlayOutletProps) {
  return (
    <DbDetailModalHost
      awakeners={getAwakeners()}
      overlaySession={props.session}
      relics={getRelics()}
      routeItem={null}
      wheels={getWheels()}
    />
  )
}

function useOverlaySessionTop(session?: DatabaseDetailOverlaySession): DatabaseDetailRef | null {
  return useSyncExternalStore(
    session?.subscribe ?? (() => () => undefined),
    session?.top ?? (() => null),
    session?.top ?? (() => null),
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
  error?: Error | null
  loadingLabel: string
  navigation: DatabaseDetailResultNavigation | null
  onClose: () => void
  onRetry?: () => void
  routeItem: DatabaseDetailRouteItem
}

function DbDetailRouteLoadingModal({
  error = null,
  loadingLabel,
  navigation,
  onClose,
  onRetry,
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
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onClose()
      }}
      onOverlayClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        aria-busy={error ? undefined : 'true'}
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
          {error ? (
            <div className='mx-auto mt-3 max-w-md text-sm text-slate-300'>
              <p role='alert'>These details could not be loaded.</p>
              <p className='mt-1 text-slate-500'>Try again, or close this window.</p>
              <div className='mt-5 flex flex-wrap justify-center gap-2'>
                <button
                  className='border border-amber-200/45 bg-amber-100/8 px-4 py-2 text-amber-100 transition-colors hover:border-amber-200/70 hover:bg-amber-100/12 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
                  onClick={onRetry}
                  type='button'
                >
                  Retry loading details
                </button>
                <button
                  className='border border-slate-500/40 bg-slate-950/70 px-4 py-2 text-slate-300 transition-colors hover:border-slate-400/65 hover:text-slate-100 focus-visible:ring-2 focus-visible:ring-slate-300/30 focus-visible:outline-none motion-reduce:transition-none'
                  onClick={onClose}
                  type='button'
                >
                  Close details
                </button>
              </div>
            </div>
          ) : (
            <output className='mt-3 block text-sm text-slate-400'>{loadingLabel}</output>
          )}
        </div>
      </div>
    </DbDetailModalFrame>
  )
}

export function DbDetailModalHost({
  awakeners,
  navigationPort,
  overlaySession,
  relics = EMPTY_RELICS,
  resultSet = null,
  routeItem,
  tabSlug,
  wheels,
}: DbDetailModalHostProps) {
  const detailLookup = useMemo(
    () => createDatabaseDetailCatalogLookup({awakeners, relics, wheels}),
    [awakeners, relics, wheels],
  )
  const overlayRef = useOverlaySessionTop(overlaySession)
  const activeRef: DatabaseDetailRef | null = routeItem
    ? {kind: routeItem.kind, id: routeItem.item.id}
    : overlayRef?.kind && isDatabaseDetailKind(overlayRef.kind)
      ? {kind: overlayRef.kind, id: overlayRef.id}
      : null
  const routeNavigation = useMemo(
    () =>
      createDatabaseDetailResultNavigation({
        currentRef: routeItem ? {kind: routeItem.kind, id: routeItem.item.id} : null,
        onSelect: (ref) => {
          if (navigationPort && routeItem) {
            selectDatabaseDetailResult(ref, navigationPort, routeItem)
          }
        },
        resultSet,
      }),
    [navigationPort, resultSet, routeItem],
  )

  if (!routeItem || activeRef?.kind !== routeItem.kind) {
    if (!routeItem && activeRef && overlaySession) {
      return (
        <Suspense
          fallback={<div className='px-2 py-3 text-sm text-slate-300'>Loading details…</div>}
        >
          <DbDetailOverlayModal
            activeRef={activeRef}
            lookup={detailLookup}
            session={overlaySession}
          />
        </Suspense>
      )
    }
    return null
  }

  if (!navigationPort) {
    throw new Error('Route detail hosts require a navigation port.')
  }

  return (
    <Suspense
      fallback={
        <DbDetailRouteLoadingModal
          loadingLabel={dbDetailRegistry[routeItem.kind].loadingLabel}
          navigation={routeNavigation}
          onClose={navigationPort.close}
          routeItem={routeItem}
        />
      }
    >
      <DbDetailRouteModal
        activeRef={activeRef}
        lookup={detailLookup}
        navigationPort={navigationPort}
        navigation={routeNavigation}
        routeItem={routeItem}
        tabSlug={tabSlug}
      />
    </Suspense>
  )
}

interface DbDetailOverlayModalProps {
  activeRef: DatabaseDetailRef
  lookup: DatabaseDetailCatalogLookup
  session: DatabaseDetailOverlaySession
}

function DbDetailOverlayModal({activeRef, lookup, session}: DbDetailOverlayModalProps) {
  const activeRefKey = `${activeRef.kind}:${activeRef.id}`
  const [overlayAwakenerTabState, setOverlayAwakenerTabState] = useState<OverlayAwakenerTabState>(
    () => ({
      activeTab: DEFAULT_DATABASE_AWAKENER_TAB,
      refKey: activeRefKey,
    }),
  )
  // Overlay refs can outlive the current public catalog; stale refs are pruned below.
  const overlayAwakenerTab = resolveOverlayAwakenerTab(activeRefKey, overlayAwakenerTabState)
  const routeItem = resolveDatabaseDetailOverlayRouteItem(activeRef, lookup, {
    tab: overlayAwakenerTab,
  })

  useEffect(() => {
    if (!routeItem) {
      session.close()
    }
  }, [routeItem, session])

  const overlayNavigationPort = useMemo<DatabaseDetailNavigationPort>(
    () => ({
      close: session.close,
      select: (ref) => {
        session.followReference(ref)
      },
      updateState: (state) => {
        const nextTab = state.tab
        if (nextTab) {
          setOverlayAwakenerTabState({
            activeTab: resolveDatabaseAwakenerTab(nextTab) ?? DEFAULT_DATABASE_AWAKENER_TAB,
            refKey: activeRefKey,
          })
        }
      },
    }),
    [activeRefKey, session],
  )

  if (!routeItem) {
    return null
  }

  return (
    <DbDetailOverlayModalContent
      id={activeRef.id}
      kind={routeItem.kind}
      lookup={lookup}
      navigationPort={overlayNavigationPort}
      routeItem={routeItem}
      session={session}
    />
  )
}

interface DbDetailOverlayModalContentProps<Kind extends DatabaseDetailKind> {
  id: string
  kind: Kind
  lookup: DatabaseDetailCatalogLookup
  navigationPort: DatabaseDetailNavigationPort
  routeItem: DatabaseDetailRouteItemByKind[Kind]
  session: DatabaseDetailOverlaySession
}

function DbDetailOverlayModalContent<Kind extends DatabaseDetailKind>({
  id,
  kind,
  lookup,
  navigationPort,
  routeItem,
  session,
}: DbDetailOverlayModalContentProps<Kind>) {
  // Public detail records can disappear between overlay open and async load completion.
  const registryEntry = dbDetailRegistry[kind]
  const {error, isLoading, record, retry} = useDatabaseDetailRecord({
    id,
    loadRecord: registryEntry.loadRecord,
  })

  useEffect(() => {
    if (!isLoading && !error && !record) {
      session.close()
    }
  }, [error, isLoading, record, session])

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>{registryEntry.loadingLabel}</div>
  }

  if (error) {
    return (
      <DbDetailRouteLoadingModal
        error={error}
        loadingLabel={registryEntry.loadingLabel}
        navigation={null}
        onClose={navigationPort.close}
        onRetry={retry}
        routeItem={routeItem}
      />
    )
  }

  if (!record) {
    return null
  }

  return registryEntry.render({
    item: routeItem,
    lookup,
    navigation: null,
    navigationPort,
    record,
  })
}

interface DbDetailRouteModalProps {
  activeRef: EntityRef
  lookup: DatabaseDetailCatalogLookup
  navigationPort: DatabaseDetailNavigationPort
  navigation: DatabaseDetailResultNavigation | null
  routeItem: DatabaseDetailRouteItem
  tabSlug?: string
}

function DbDetailRouteModal({
  activeRef,
  lookup,
  navigationPort,
  navigation,
  routeItem,
  tabSlug,
}: DbDetailRouteModalProps) {
  if (routeItem.kind === 'awakener') {
    return (
      <DbDetailAwakenerRouteModal
        activeRef={activeRef}
        lookup={lookup}
        navigationPort={navigationPort}
        navigation={navigation}
        routeItem={routeItem}
        tabSlug={tabSlug}
      />
    )
  }
  if (routeItem.kind === 'relic') {
    return (
      <DbDetailRelicRouteModal
        activeRef={activeRef}
        lookup={lookup}
        navigationPort={navigationPort}
        navigation={navigation}
        routeItem={routeItem}
      />
    )
  }
  return (
    <DbDetailNonAwakenerRouteModal
      activeRef={activeRef}
      lookup={lookup}
      navigationPort={navigationPort}
      kind={routeItem.kind}
      navigation={navigation}
      routeItem={routeItem}
    />
  )
}

interface DbDetailKindRouteModalProps<Kind extends DatabaseDetailKind> {
  activeRef: EntityRef
  lookup: DatabaseDetailCatalogLookup
  navigationPort: DatabaseDetailNavigationPort
  navigation: DatabaseDetailResultNavigation | null
  routeItem: DatabaseDetailRouteItemByKind[Kind]
  tabSlug?: string
}

interface DbDetailNonAwakenerRouteModalProps<
  Kind extends Exclude<DatabaseDetailKind, 'awakener' | 'relic'>,
> extends DbDetailKindRouteModalProps<Kind> {
  kind: Kind
}

interface DbDetailRouteRecordBoundaryProps<Kind extends Exclude<DatabaseDetailKind, 'awakener'>> {
  activeRef: EntityRef
  children: (record: DatabaseDetailRecordByKind[Kind]) => ReactNode
  kind: Kind
  navigation: DatabaseDetailResultNavigation | null
  navigationPort: DatabaseDetailNavigationPort
  routeItem: DatabaseDetailRouteItemByKind[Kind]
}

function DbDetailRouteRecordBoundary<Kind extends Exclude<DatabaseDetailKind, 'awakener'>>({
  activeRef,
  children,
  kind,
  navigation,
  navigationPort,
  routeItem,
}: DbDetailRouteRecordBoundaryProps<Kind>) {
  const registryEntry = dbDetailRegistry[kind]
  const {error, isLoading, record, retry} = useDatabaseDetailRouteRecord({
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
        onClose={navigationPort.close}
        routeItem={routeItem}
      />
    )
  }

  if (error) {
    return (
      <DbDetailRouteLoadingModal
        error={error}
        loadingLabel={registryEntry.loadingLabel}
        navigation={navigation}
        onClose={navigationPort.close}
        onRetry={retry}
        routeItem={routeItem}
      />
    )
  }

  return record ? children(record) : null
}

function DbDetailAwakenerRouteModal({
  activeRef,
  lookup,
  navigationPort,
  navigation,
  routeItem,
  tabSlug,
}: DbDetailKindRouteModalProps<'awakener'>) {
  const routerLocation = useLocation()
  const navigate = useNavigate()
  const routerLocationState: unknown = routerLocation.state
  const registryEntry = dbDetailRegistry.awakener
  const {error, isLoading, record, retry} = useDatabaseDetailRouteRecord({
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
      {replace: true, state: routerLocationState},
    )
  }, [
    canonicalTabPath,
    navigate,
    record,
    routerLocation.pathname,
    routerLocation.search,
    routerLocationState,
  ])

  if (isLoading) {
    return (
      <DbDetailRouteLoadingModal
        loadingLabel={registryEntry.loadingLabel}
        navigation={navigation}
        onClose={navigationPort.close}
        routeItem={routeItem}
      />
    )
  }

  if (error) {
    return (
      <DbDetailRouteLoadingModal
        error={error}
        loadingLabel={registryEntry.loadingLabel}
        navigation={navigation}
        onClose={navigationPort.close}
        onRetry={retry}
        routeItem={routeItem}
      />
    )
  }

  if (!record) {
    return null
  }

  return registryEntry.render({
    item: routeItem,
    lookup,
    navigation,
    navigationPort,
    record,
  })
}

function DbDetailNonAwakenerRouteModal<
  Kind extends Exclude<DatabaseDetailKind, 'awakener' | 'relic'>,
>({
  activeRef,
  lookup,
  navigationPort,
  kind,
  navigation,
  routeItem,
}: DbDetailNonAwakenerRouteModalProps<Kind>) {
  const registryEntry = dbDetailRegistry[kind]
  return (
    <DbDetailRouteRecordBoundary
      activeRef={activeRef}
      kind={kind}
      navigation={navigation}
      navigationPort={navigationPort}
      routeItem={routeItem}
    >
      {(record) =>
        registryEntry.render({
          item: routeItem,
          lookup,
          navigation,
          navigationPort,
          record,
        })
      }
    </DbDetailRouteRecordBoundary>
  )
}

function DbDetailRelicRouteModal({
  activeRef,
  lookup,
  navigationPort,
  navigation,
  routeItem,
}: DbDetailKindRouteModalProps<'relic'>) {
  const location = useLocation()
  const locationState: unknown = location.state
  const registryEntry = dbDetailRegistry.relic
  return (
    <DbDetailRouteRecordBoundary
      activeRef={activeRef}
      kind='relic'
      navigation={navigation}
      navigationPort={navigationPort}
      routeItem={routeItem}
    >
      {(record) => {
        const resolution = resolveRelicDetailRoutePolicy({location, record, routeItem})

        return (
          <>
            {resolution.replaceTarget ? (
              <Navigate replace state={locationState} to={resolution.replaceTarget} />
            ) : null}
            {registryEntry.render({
              item: resolution.renderItem,
              lookup,
              navigation,
              navigationPort,
              record,
            })}
          </>
        )
      }}
    </DbDetailRouteRecordBoundary>
  )
}
