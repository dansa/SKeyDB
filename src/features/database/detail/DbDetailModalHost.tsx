import {Suspense, useEffect, useState, useSyncExternalStore} from 'react'

import {useLocation, useNavigate} from 'react-router-dom'

import type {Awakener} from '@/domain/awakeners'
import {getCovenants, type Covenant} from '@/domain/covenants'
import {
  buildDatabaseAwakenerPath,
  resolveDatabaseAwakenerTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import type {EntityRef} from '@/domain/entities/types'
import {getPosses} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'
import {useDatabaseDetailRouteRecord} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {
  dbDetailRegistry,
  type DatabaseDetailKind,
  type DatabaseDetailRenderCallbacks,
  type DatabaseDetailRouteItem,
} from './dbDetailRegistry'

type DatabaseDetailRef = EntityRef & {kind: DatabaseDetailKind}

interface DbDetailModalHostProps {
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
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

function resolveOverlayRouteItem(
  ref: EntityRef,
  awakeners: Awakener[],
  wheels: Wheel[],
  activeAwakenerTab: DatabaseAwakenerTab = 'overview',
): DatabaseDetailRouteItem | null {
  if (ref.kind === 'awakener') {
    const item = awakeners.find((awakener) => awakener.id === ref.id)
    return item ? {kind: 'awakener', item, activeTab: activeAwakenerTab} : null
  }
  if (ref.kind === 'wheel') {
    const item = wheels.find((wheel) => wheel.id === ref.id)
    return item ? {kind: 'wheel', item} : null
  }
  if (ref.kind === 'posse') {
    const item = getPosses().find((posse) => posse.id === ref.id)
    return item ? {kind: 'posse', item} : null
  }
  if (ref.kind === 'covenant') {
    const item = getCovenants().find((covenant) => covenant.id === ref.id)
    return item ? {kind: 'covenant', item} : null
  }
  return null
}

function resolveAwakenerRef(
  awakeners: Awakener[],
  awakener: Pick<Awakener, 'id' | 'name'>,
): EntityRef | null {
  const byId = awakeners.find((entry) => entry.id === awakener.id)
  if (byId) {
    return {kind: 'awakener', id: byId.id}
  }

  const normalizedName = awakener.name.trim().toLowerCase()
  const byName = awakeners.find((entry) => entry.name.trim().toLowerCase() === normalizedName)
  return byName ? {kind: 'awakener', id: byName.id} : null
}

function resolveWheelRef(wheels: Wheel[], wheel: Pick<Wheel, 'name'>): EntityRef | null {
  if ('id' in wheel && typeof wheel.id === 'string') {
    const byId = wheels.find((entry) => entry.id === wheel.id)
    if (byId) {
      return {kind: 'wheel', id: byId.id}
    }
  }

  const normalizedName = wheel.name.trim().toLowerCase()
  const byName = wheels.find((entry) => entry.name.trim().toLowerCase() === normalizedName)
  return byName ? {kind: 'wheel', id: byName.id} : null
}

function resolveCovenantRef(covenant: Pick<Covenant, 'name'>): EntityRef | null {
  if ('id' in covenant && typeof covenant.id === 'string') {
    const byId = getCovenants().find((entry) => entry.id === covenant.id)
    if (byId) {
      return {kind: 'covenant', id: byId.id}
    }
  }

  const normalizedName = covenant.name.trim().toLowerCase()
  const byName = getCovenants().find((entry) => entry.name.trim().toLowerCase() === normalizedName)
  return byName ? {kind: 'covenant', id: byName.id} : null
}

function useDbDetailOverlayRecord(
  id: string,
  loadRecord: (id: string) => Promise<object | undefined>,
) {
  const [state, setState] = useState<{
    id: string
    isLoading: boolean
    record: object | null
  }>(() => ({
    id,
    isLoading: true,
    record: null,
  }))

  useEffect(() => {
    let isCancelled = false

    void loadRecord(id).then((nextRecord) => {
      if (isCancelled) {
        return
      }

      setState({
        id,
        isLoading: false,
        record: nextRecord ?? null,
      })
    })

    return () => {
      isCancelled = true
    }
  }, [id, loadRecord])

  if (state.id !== id) {
    return {isLoading: true, record: null}
  }

  return {
    isLoading: state.isLoading,
    record: state.record,
  }
}

export function DbDetailModalHost({
  awakeners,
  callbacks,
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
    <Suspense fallback={<div className='px-2 py-3 text-sm text-slate-300'>Loading details...</div>}>
      <DbDetailRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
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
  }>(() => ({activeTab: 'overview', refKey: activeRefKey}))
  const overlayAwakenerTab =
    overlayAwakenerTabState.refKey === activeRefKey ? overlayAwakenerTabState.activeTab : 'overview'
  const routeItem = resolveOverlayRouteItem(activeRef, awakeners, wheels, overlayAwakenerTab)
  const registryEntry = dbDetailRegistry[activeRef.kind]
  const {isLoading, record} = useDbDetailOverlayRecord(activeRef.id, registryEntry.loadRecord)

  useEffect(() => {
    if (!routeItem) {
      dbDetailStore.getState().popDetail()
    }
  }, [routeItem])

  useEffect(() => {
    if (routeItem && !isLoading && !record) {
      dbDetailStore.getState().popDetail()
    }
  }, [isLoading, record, routeItem])

  if (!routeItem) {
    return null
  }

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>{registryEntry.loadingLabel}</div>
  }

  if (!record) {
    return null
  }

  return registryEntry.render({
    awakeners,
    callbacks: {
      ...callbacks,
      onClose: () => {
        dbDetailStore.getState().popDetail()
      },
      onTabChange: (nextTab) => {
        setOverlayAwakenerTabState({activeTab: nextTab, refKey: activeRefKey})
      },
      onSelectAwakener: (awakener) => {
        const ref = resolveAwakenerRef(awakeners, awakener)
        if (ref) {
          dbDetailStore.getState().pushReferenceDetail(ref)
        }
      },
      onSelectWheel: (wheel) => {
        const ref = resolveWheelRef(wheels, wheel)
        if (ref) {
          dbDetailStore.getState().pushReferenceDetail(ref)
        }
      },
      onSelectCovenant: (covenant) => {
        const ref = resolveCovenantRef(covenant)
        if (ref) {
          dbDetailStore.getState().pushReferenceDetail(ref)
        }
      },
    },
    item: routeItem,
    record,
    wheels,
  })
}

interface DbDetailRouteModalProps {
  activeRef: EntityRef
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  routeItem: DatabaseDetailRouteItem
  tabSlug?: string
  wheels: Wheel[]
}

function DbDetailRouteModal({
  activeRef,
  awakeners,
  callbacks,
  routeItem,
  tabSlug,
  wheels,
}: DbDetailRouteModalProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const registryEntry = dbDetailRegistry[routeItem.kind]
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })
  const resolvedTabSlug =
    routeItem.kind === 'awakener' && tabSlug ? resolveDatabaseAwakenerTab(tabSlug) : null

  useEffect(() => {
    if (routeItem.kind !== 'awakener' || !record || !tabSlug || !resolvedTabSlug) {
      return
    }

    const canonicalPath = buildDatabaseAwakenerPath(routeItem.item, resolvedTabSlug)
    if (location.pathname === canonicalPath) {
      return
    }

    void navigate(
      {
        pathname: canonicalPath,
        search: location.search,
      },
      {replace: true},
    )
  }, [location.pathname, location.search, navigate, record, resolvedTabSlug, routeItem, tabSlug])

  useEffect(() => {
    if (routeItem.kind !== 'awakener' || !record || !tabSlug || resolvedTabSlug) {
      return
    }

    void navigate(
      {
        pathname: buildDatabaseAwakenerPath(routeItem.item),
        search: location.search,
      },
      {replace: true},
    )
  }, [location.search, navigate, record, resolvedTabSlug, routeItem, tabSlug])

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
    record,
    wheels,
  })
}
