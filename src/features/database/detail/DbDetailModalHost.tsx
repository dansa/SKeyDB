import {Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore} from 'react'

import {FaMagnifyingGlass, FaXmark} from 'react-icons/fa6'
import {useLocation, useNavigate} from 'react-router-dom'

import type {Awakener} from '@/domain/awakeners'
import {getCovenants, type Covenant} from '@/domain/covenants'
import {
  buildDatabaseAwakenerPath,
  DEFAULT_DATABASE_AWAKENER_TAB,
  resolveDatabaseAwakenerTab,
  resolveDatabaseAwakenerVisibleTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import {getPosses} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'
import {
  preloadDatabaseDetailRecord,
  useDatabaseDetailRecord,
  useDatabaseDetailRouteRecord,
} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {
  createDatabaseDetailResultNavigation,
  type DatabaseDetailResultNavigation,
  type DatabaseDetailResultSelectRef,
  type DatabaseDetailResultSet,
} from './database-detail-result-navigation'
import {DatabaseDetailResultNavigator} from './DatabaseDetailResultNavigator'
import {DbDetailModalFrame} from './DbDetailModalFrame'
import {
  dbDetailRegistry,
  type DatabaseDetailKind,
  type DatabaseDetailRenderCallbacks,
  type DatabaseDetailRouteItem,
  type DatabaseDetailRouteItemByKind,
} from './dbDetailRegistry'

type DatabaseDetailRef = EntityRef & {kind: DatabaseDetailKind}

interface DetailRefLookup {
  awakenersById: Map<string, Awakener>
  awakenersByName: Map<string, Awakener>
  covenantsById: Map<string, Covenant>
  covenantsByName: Map<string, Covenant>
  possesById: Map<string, ReturnType<typeof getPosses>[number]>
  wheelsById: Map<string, Wheel>
  wheelsByName: Map<string, Wheel>
}

interface DbDetailModalHostProps {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  resultSet?: DatabaseDetailResultSet | null
  routeItem: DatabaseDetailRouteItem | null
  tabSlug?: string
  wheels: Wheel[]
}

function useDbDetailStackTop(): EntityRef | null {
  return useSyncExternalStore(
    dbDetailStore.subscribe,
    () => dbDetailStore.getState().stack.at(-1) ?? null,
    () => dbDetailStore.getState().stack.at(-1) ?? null,
  )
}

function isDatabaseDetailKind(kind: EntityRef['kind']): kind is DatabaseDetailKind {
  return kind in dbDetailRegistry
}

function normalizeDetailName(name: string) {
  return name.trim().toLowerCase()
}

function setFirstNormalizedNameMatch<T extends {name: string}>(lookup: Map<string, T>, item: T) {
  const normalizedName = normalizeDetailName(item.name)
  if (!lookup.has(normalizedName)) {
    lookup.set(normalizedName, item)
  }
}

function setFirstIdMatch<T extends {id: string}>(lookup: Map<string, T>, item: T) {
  if (!lookup.has(item.id)) {
    lookup.set(item.id, item)
  }
}

function buildDetailRefLookup(awakeners: Awakener[], wheels: Wheel[]): DetailRefLookup {
  const lookup: DetailRefLookup = {
    awakenersById: new Map(),
    awakenersByName: new Map(),
    covenantsById: new Map(),
    covenantsByName: new Map(),
    possesById: new Map(),
    wheelsById: new Map(),
    wheelsByName: new Map(),
  }

  for (const awakener of awakeners) {
    setFirstIdMatch(lookup.awakenersById, awakener)
    setFirstNormalizedNameMatch(lookup.awakenersByName, awakener)
  }

  for (const wheel of wheels) {
    setFirstIdMatch(lookup.wheelsById, wheel)
    setFirstNormalizedNameMatch(lookup.wheelsByName, wheel)
  }

  for (const posse of getPosses()) {
    setFirstIdMatch(lookup.possesById, posse)
  }

  for (const covenant of getCovenants()) {
    setFirstIdMatch(lookup.covenantsById, covenant)
    setFirstNormalizedNameMatch(lookup.covenantsByName, covenant)
  }

  return lookup
}

function resolveOverlayRouteItem(
  ref: EntityRef,
  lookup: DetailRefLookup,
  activeAwakenerTab: DatabaseAwakenerTab = DEFAULT_DATABASE_AWAKENER_TAB,
): DatabaseDetailRouteItem | null {
  if (ref.kind === 'awakener') {
    const item = lookup.awakenersById.get(ref.id)
    return item ? {kind: 'awakener', item, activeTab: activeAwakenerTab} : null
  }
  if (ref.kind === 'wheel') {
    const item = lookup.wheelsById.get(ref.id)
    return item ? {kind: 'wheel', item} : null
  }
  if (ref.kind === 'posse') {
    const item = lookup.possesById.get(ref.id)
    return item ? {kind: 'posse', item} : null
  }
  if (ref.kind === 'covenant') {
    const item = lookup.covenantsById.get(ref.id)
    return item ? {kind: 'covenant', item} : null
  }
  return null
}

function resolveAwakenerRef(
  lookup: DetailRefLookup,
  awakener: Pick<Awakener, 'id' | 'name'>,
): EntityRef | null {
  const byId = lookup.awakenersById.get(awakener.id)
  if (byId) {
    return {kind: 'awakener', id: byId.id}
  }

  const byName = lookup.awakenersByName.get(normalizeDetailName(awakener.name))
  return byName ? {kind: 'awakener', id: byName.id} : null
}

function resolveWheelRef(
  lookup: DetailRefLookup,
  wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>,
): EntityRef | null {
  if ('id' in wheel && typeof wheel.id === 'string') {
    const byId = lookup.wheelsById.get(wheel.id)
    if (byId) {
      return {kind: 'wheel', id: byId.id}
    }
  }

  const byName = lookup.wheelsByName.get(normalizeDetailName(wheel.name))
  return byName ? {kind: 'wheel', id: byName.id} : null
}

function resolveCovenantRef(
  lookup: DetailRefLookup,
  covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>,
): EntityRef | null {
  if ('id' in covenant && typeof covenant.id === 'string') {
    const byId = lookup.covenantsById.get(covenant.id)
    if (byId) {
      return {kind: 'covenant', id: byId.id}
    }
  }

  const byName = lookup.covenantsByName.get(normalizeDetailName(covenant.name))
  return byName ? {kind: 'covenant', id: byName.id} : null
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

function selectDatabaseDetailResult(
  ref: DatabaseDetailResultSelectRef,
  callbacks: DatabaseDetailRenderCallbacks,
  activeAwakenerTab: DatabaseAwakenerTab,
) {
  if (ref.kind === 'awakener') {
    callbacks.onSelectAwakener(ref, activeAwakenerTab)
  } else if (ref.kind === 'wheel') {
    callbacks.onSelectWheel(ref)
  } else if (ref.kind === 'posse') {
    callbacks.onSelectPosse(ref)
  } else {
    callbacks.onSelectCovenant(ref)
  }
}

function preloadDatabaseDetailResult(ref: DatabaseDetailResultSelectRef) {
  let preload: Promise<void>
  if (ref.kind === 'awakener') {
    preload = preloadDatabaseDetailRecord({
      id: ref.id,
      loadRecord: dbDetailRegistry.awakener.loadRecord,
    })
  } else if (ref.kind === 'wheel') {
    preload = preloadDatabaseDetailRecord({
      id: ref.id,
      loadRecord: dbDetailRegistry.wheel.loadRecord,
    })
  } else if (ref.kind === 'posse') {
    preload = preloadDatabaseDetailRecord({
      id: ref.id,
      loadRecord: dbDetailRegistry.posse.loadRecord,
    })
  } else {
    preload = preloadDatabaseDetailRecord({
      id: ref.id,
      loadRecord: dbDetailRegistry.covenant.loadRecord,
    })
  }

  void preload.catch(() => undefined)
}

function getLoadingShellMaxWidth(kind: DatabaseDetailKind): 'standard' | 'wide' {
  return kind === 'posse' || kind === 'covenant' ? 'standard' : 'wide'
}

function getLoadingPlaceholderLabel(kind: DatabaseDetailKind): string | null {
  if (kind === 'awakener') {
    return 'Jump to awakener...'
  }
  if (kind === 'wheel') {
    return 'Jump to wheel...'
  }
  return null
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
  const searchPlaceholderLabel = getLoadingPlaceholderLabel(routeItem.kind)

  return (
    <DbDetailModalFrame
      ariaLabel={`${itemName} details`}
      beforeBody={
        <>
          {searchPlaceholderLabel ? (
            <div
              aria-hidden
              className='flex shrink-0 items-center gap-2 border border-amber-200/18 bg-slate-950/[.96] px-3 py-2 text-sm text-slate-500 shadow-[0_12px_26px_rgba(2,6,23,0.45)]'
              data-detail-modal-external=''
            >
              <FaMagnifyingGlass className='h-3.5 w-3.5 shrink-0' />
              <span>{searchPlaceholderLabel}</span>
            </div>
          ) : null}
          <DatabaseDetailResultNavigator navigation={navigation} />
        </>
      }
      maxWidth={getLoadingShellMaxWidth(routeItem.kind)}
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
          className='absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center border border-amber-200/12 bg-slate-950/78 text-slate-400 transition-colors hover:border-amber-200/28 hover:text-amber-100 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none motion-reduce:transition-none'
          onClick={onClose}
          type='button'
        >
          <FaXmark className='h-4 w-4' />
        </button>
        <div>
          <div className='ui-title text-lg text-amber-100'>{itemName}</div>
          <div className='mt-3 text-sm text-slate-400' role='status'>
            {loadingLabel}
          </div>
        </div>
      </div>
    </DbDetailModalFrame>
  )
}

export function DbDetailModalHost({
  awakeners,
  callbacks,
  resultSet = null,
  routeItem,
  tabSlug,
  wheels,
}: DbDetailModalHostProps) {
  const stackTop = useDbDetailStackTop()
  const activeRef: DatabaseDetailRef | null = routeItem
    ? {kind: routeItem.kind, id: routeItem.item.id}
    : stackTop?.kind && isDatabaseDetailKind(stackTop.kind)
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
    if (!routeItem || !routeNavigation) {
      return
    }

    if (routeNavigation.previous) {
      preloadDatabaseDetailResult(routeNavigation.previous.ref)
    }
    if (routeNavigation.next) {
      preloadDatabaseDetailResult(routeNavigation.next.ref)
    }
  }, [routeItem, routeNavigation])

  useEffect(() => {
    dbDetailStore
      .getState()
      .syncFromRoute(routeItem ? {kind: routeItem.kind, id: routeItem.item.id} : null)
  }, [routeItem])

  useEffect(() => {
    if (!routeItem && stackTop && !(stackTop.kind in dbDetailRegistry)) {
      dbDetailStore.getState().popDetail()
    }
  }, [routeItem, stackTop])

  if (!routeItem || activeRef?.kind !== routeItem.kind) {
    if (!routeItem && activeRef) {
      return (
        <Suspense
          fallback={<div className='px-2 py-3 text-sm text-slate-300'>Loading details...</div>}
        >
          <DbDetailOverlayModal
            activeRef={activeRef}
            awakeners={awakeners}
            callbacks={callbacks}
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
  wheels: Wheel[]
}

function DbDetailOverlayModal({
  activeRef,
  awakeners,
  callbacks,
  wheels,
}: DbDetailOverlayModalProps) {
  const activeRefKey = `${activeRef.kind}:${activeRef.id}`
  const [overlayAwakenerTabState, setOverlayAwakenerTabState] = useState<{
    activeTab: DatabaseAwakenerTab
    refKey: string
  }>(() => ({activeTab: DEFAULT_DATABASE_AWAKENER_TAB, refKey: activeRefKey}))
  const overlayAwakenerTab =
    overlayAwakenerTabState.refKey === activeRefKey
      ? overlayAwakenerTabState.activeTab
      : DEFAULT_DATABASE_AWAKENER_TAB
  const detailRefLookup = useMemo(
    () => buildDetailRefLookup(awakeners, wheels),
    [awakeners, wheels],
  )
  const routeItem = resolveOverlayRouteItem(activeRef, detailRefLookup, overlayAwakenerTab)

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
      const ref = resolveAwakenerRef(detailRefLookup, awakener)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    [detailRefLookup],
  )
  const onSelectWheel = useCallback(
    (wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>) => {
      const ref = resolveWheelRef(detailRefLookup, wheel)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    [detailRefLookup],
  )
  const onSelectCovenant = useCallback(
    (covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>) => {
      const ref = resolveCovenantRef(detailRefLookup, covenant)
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

  if (routeItem.kind === 'awakener') {
    return (
      <DbDetailOverlayModalContent
        awakeners={awakeners}
        callbacks={overlayCallbacks}
        id={activeRef.id}
        kind='awakener'
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  if (routeItem.kind === 'wheel') {
    return (
      <DbDetailOverlayModalContent
        awakeners={awakeners}
        callbacks={overlayCallbacks}
        id={activeRef.id}
        kind='wheel'
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  if (routeItem.kind === 'posse') {
    return (
      <DbDetailOverlayModalContent
        awakeners={awakeners}
        callbacks={overlayCallbacks}
        id={activeRef.id}
        kind='posse'
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  return (
    <DbDetailOverlayModalContent
      awakeners={awakeners}
      callbacks={overlayCallbacks}
      id={activeRef.id}
      kind='covenant'
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
  const registryEntry = dbDetailRegistry[kind]
  const {isLoading, record} = useDatabaseDetailRecord({
    id,
    loadRecord: registryEntry.loadRecord,
  })

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
  if (routeItem.kind === 'wheel') {
    return (
      <DbDetailNonAwakenerRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        kind='wheel'
        navigation={navigation}
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  if (routeItem.kind === 'posse') {
    return (
      <DbDetailNonAwakenerRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        kind='posse'
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
      kind='covenant'
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
  Kind extends Exclude<DatabaseDetailKind, 'awakener'>,
> extends DbDetailKindRouteModalProps<Kind> {
  kind: Kind
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
  const location = useLocation()
  const navigate = useNavigate()
  const registryEntry = dbDetailRegistry.awakener
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })
  const canonicalTabPath = resolveAwakenerTabCanonicalPath(routeItem.item, tabSlug)

  useEffect(() => {
    if (!record || !canonicalTabPath || location.pathname === canonicalTabPath) {
      return
    }

    void navigate(
      {
        pathname: canonicalTabPath,
        search: location.search,
      },
      {replace: true},
    )
  }, [canonicalTabPath, location.pathname, location.search, navigate, record])

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

function DbDetailNonAwakenerRouteModal<Kind extends Exclude<DatabaseDetailKind, 'awakener'>>({
  activeRef,
  awakeners,
  callbacks,
  kind,
  navigation,
  routeItem,
  wheels,
}: DbDetailNonAwakenerRouteModalProps<Kind>) {
  const registryEntry = dbDetailRegistry[kind]
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })

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

  return registryEntry.render({awakeners, callbacks, item: routeItem, navigation, record, wheels})
}
