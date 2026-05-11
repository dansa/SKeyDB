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
import {
  useDatabaseDetailRecord,
  useDatabaseDetailRouteRecord,
} from '@/features/database/internal/useDatabaseDetailRouteRecord'
import {dbDetailStore} from '@/stores/dbDetailStore'

import {
  dbDetailRegistry,
  type DatabaseDetailKind,
  type DatabaseDetailRenderCallbacks,
  type DatabaseDetailRouteItem,
  type DatabaseDetailRouteItemByKind,
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

function resolveWheelRef(
  wheels: Wheel[],
  wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>,
): EntityRef | null {
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

function resolveCovenantRef(
  covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>,
): EntityRef | null {
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

function resolveAwakenerTabCanonicalPath(
  awakener: Awakener,
  tabSlug: string | undefined,
): string | null {
  if (!tabSlug) {
    return null
  }

  const resolvedTab = resolveDatabaseAwakenerTab(tabSlug)
  return buildDatabaseAwakenerPath(awakener, resolvedTab ?? 'overview')
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

  useEffect(() => {
    if (!routeItem) {
      dbDetailStore.getState().popDetail()
    }
  }, [routeItem])

  const overlayCallbacks = {
    ...callbacks,
    onClose: () => {
      dbDetailStore.getState().popDetail()
    },
    onTabChange: (nextTab: DatabaseAwakenerTab) => {
      setOverlayAwakenerTabState({activeTab: nextTab, refKey: activeRefKey})
    },
    onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>) => {
      const ref = resolveAwakenerRef(awakeners, awakener)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    onSelectWheel: (wheel: Pick<Wheel, 'name'> & Partial<Pick<Wheel, 'id'>>) => {
      const ref = resolveWheelRef(wheels, wheel)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
    onSelectCovenant: (covenant: Pick<Covenant, 'name'> & Partial<Pick<Covenant, 'id'>>) => {
      const ref = resolveCovenantRef(covenant)
      if (ref) {
        dbDetailStore.getState().pushReferenceDetail(ref)
      }
    },
  }

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
  if (routeItem.kind === 'awakener') {
    return (
      <DbDetailAwakenerRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        routeItem={routeItem}
        tabSlug={tabSlug}
        wheels={wheels}
      />
    )
  }
  if (routeItem.kind === 'wheel') {
    return (
      <DbDetailWheelRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  if (routeItem.kind === 'posse') {
    return (
      <DbDetailPosseRouteModal
        activeRef={activeRef}
        awakeners={awakeners}
        callbacks={callbacks}
        routeItem={routeItem}
        wheels={wheels}
      />
    )
  }
  return (
    <DbDetailCovenantRouteModal
      activeRef={activeRef}
      awakeners={awakeners}
      callbacks={callbacks}
      routeItem={routeItem}
      wheels={wheels}
    />
  )
}

interface DbDetailKindRouteModalProps<Kind extends DatabaseDetailKind> {
  activeRef: EntityRef
  awakeners: Awakener[]
  callbacks: DatabaseDetailRenderCallbacks
  routeItem: Extract<DatabaseDetailRouteItem, {kind: Kind}>
  tabSlug?: string
  wheels: Wheel[]
}

function DbDetailAwakenerRouteModal({
  activeRef,
  awakeners,
  callbacks,
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

function DbDetailWheelRouteModal({
  activeRef,
  awakeners,
  callbacks,
  routeItem,
  wheels,
}: DbDetailKindRouteModalProps<'wheel'>) {
  const registryEntry = dbDetailRegistry.wheel
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>{registryEntry.loadingLabel}</div>
  }

  if (!record) {
    return null
  }

  return registryEntry.render({awakeners, callbacks, item: routeItem, record, wheels})
}

function DbDetailPosseRouteModal({
  activeRef,
  awakeners,
  callbacks,
  routeItem,
  wheels,
}: DbDetailKindRouteModalProps<'posse'>) {
  const registryEntry = dbDetailRegistry.posse
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>{registryEntry.loadingLabel}</div>
  }

  if (!record) {
    return null
  }

  return registryEntry.render({awakeners, callbacks, item: routeItem, record, wheels})
}

function DbDetailCovenantRouteModal({
  activeRef,
  awakeners,
  callbacks,
  routeItem,
  wheels,
}: DbDetailKindRouteModalProps<'covenant'>) {
  const registryEntry = dbDetailRegistry.covenant
  const {isLoading, record} = useDatabaseDetailRouteRecord({
    id: activeRef.id,
    loadRecord: registryEntry.loadRecord,
    missingPathname: registryEntry.missingBrowsePath,
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>{registryEntry.loadingLabel}</div>
  }

  if (!record) {
    return null
  }

  return registryEntry.render({awakeners, callbacks, item: routeItem, record, wheels})
}
