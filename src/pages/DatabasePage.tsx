import {lazy, Suspense, useEffect, useRef} from 'react'

import {useLocation, useNavigate, useParams} from 'react-router-dom'

import emojiWke from '@/assets/emoji/Emoji_WKE_S_06.webp'
import {getAwakeners, type Awakener} from '@/domain/awakeners'
import {loadAwakenerFullV2ById} from '@/domain/awakeners-full-v2-loader'
import {buildDatabaseEntityBrowsePath} from '@/domain/database-entity-paths'
import {
  buildDatabaseAwakenerPath,
  buildDatabaseWheelBrowsePath,
  buildDatabaseWheelPath,
  findAwakenerByDatabaseSlug,
  findWheelByDatabaseSlug,
  resolveDatabaseAwakenerTab,
  type DatabaseAwakenerTab,
} from '@/domain/database-paths'
import {getWheels, type Wheel} from '@/domain/wheels'
import {loadWheelFullV1ById} from '@/domain/wheels-full-v1-loader'

import {DatabaseEntityTabs} from './database/DatabaseEntityTabs'
import {DatabaseFilters} from './database/DatabaseFilters'
import {DatabaseGrid} from './database/DatabaseGrid'
import {useDatabaseBrowseState} from './database/useDatabaseBrowseState'
import {useDatabaseDetailRouteRecord} from './database/useDatabaseDetailRouteRecord'
import {useDatabaseViewModel} from './database/useDatabaseViewModel'
import {useWheelsDatabaseBrowseState} from './database/useWheelsDatabaseBrowseState'
import {useWheelsDatabaseViewModel} from './database/useWheelsDatabaseViewModel'
import {WheelsDatabaseSection} from './database/WheelsDatabaseSection'
import {useGlobalSearchCapture} from './useGlobalSearchCapture'

const AwakenerDetailModal = lazy(() =>
  import('./database/AwakenerDetailModal').then((module) => ({
    default: module.AwakenerDetailModal,
  })),
)
const WheelDetailModal = lazy(() =>
  import('./database/WheelDetailModal').then((module) => ({
    default: module.WheelDetailModal,
  })),
)
const databaseAwakeners = getAwakeners()
const databaseWheels = getWheels()

export function DatabasePage() {
  const awakenerBrowseState = useDatabaseBrowseState()
  const awakenerViewModel = useDatabaseViewModel(databaseAwakeners, awakenerBrowseState)
  const wheelBrowseState = useWheelsDatabaseBrowseState()
  const wheelViewModel = useWheelsDatabaseViewModel(databaseWheels, wheelBrowseState)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const {awakenerSlug, tabSlug, wheelSlug} = useParams<{
    awakenerSlug?: string
    tabSlug?: string
    wheelSlug?: string
  }>()
  const selectedAwakener = findAwakenerByDatabaseSlug(databaseAwakeners, awakenerSlug)
  const selectedWheel = findWheelByDatabaseSlug(databaseWheels, wheelSlug)
  const selectedTab = resolveDatabaseAwakenerTab(tabSlug) ?? 'overview'
  const isWheelRoute = location.pathname.startsWith(buildDatabaseWheelBrowsePath())
  const activeEntity = isWheelRoute ? 'wheels' : 'awakeners'
  const browsePath = isWheelRoute
    ? buildDatabaseEntityBrowsePath('wheels')
    : buildDatabaseEntityBrowsePath('awakeners')

  useGlobalSearchCapture({
    enabled: !selectedAwakener && !selectedWheel,
    searchInputRef,
    onAppendCharacter: isWheelRoute
      ? wheelBrowseState.appendSearchCharacter
      : awakenerBrowseState.appendSearchCharacter,
    onRemoveCharacter: isWheelRoute
      ? wheelBrowseState.removeSearchCharacter
      : awakenerBrowseState.removeSearchCharacter,
    onClearSearch: isWheelRoute ? wheelBrowseState.clearQuery : awakenerBrowseState.clearQuery,
  })

  useEffect(() => {
    if (awakenerSlug && !selectedAwakener) {
      void navigate(
        {
          pathname: buildDatabaseEntityBrowsePath('awakeners'),
          search: location.search,
        },
        {replace: true},
      )
    }
  }, [awakenerSlug, location.search, navigate, selectedAwakener])

  useEffect(() => {
    if (wheelSlug && !selectedWheel) {
      void navigate(
        {
          pathname: buildDatabaseWheelBrowsePath(),
          search: location.search,
        },
        {replace: true},
      )
    }
  }, [location.search, navigate, selectedWheel, wheelSlug])

  function openAwakenerDetail(awakenerId: number) {
    const awakener = databaseAwakeners.find((entry) => entry.id === awakenerId)
    if (!awakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(awakener),
      search: location.search,
    })
  }

  function openWheelDetail(wheelId: string) {
    const wheel = databaseWheels.find((entry) => entry.id === wheelId)
    if (!wheel) {
      return
    }
    void navigate({
      pathname: buildDatabaseWheelPath(wheel),
      search: location.search,
    })
  }

  function closeDetail() {
    void navigate({pathname: browsePath, search: location.search})
  }

  function handleDetailTabChange(nextTab: DatabaseAwakenerTab) {
    if (!selectedAwakener) {
      return
    }
    void navigate({
      pathname: buildDatabaseAwakenerPath(selectedAwakener, nextTab),
      search: location.search,
    })
  }

  function handleModalAwakenerSelect(
    nextAwakener: Pick<Awakener, 'id' | 'name'>,
    nextTab: DatabaseAwakenerTab = 'overview',
  ) {
    void navigate({
      pathname: buildDatabaseAwakenerPath(nextAwakener, nextTab),
      search: location.search,
    })
  }

  function handleModalWheelSelect(nextWheel: Pick<Wheel, 'name'>) {
    void navigate({
      pathname: buildDatabaseWheelPath(nextWheel),
      search: location.search,
    })
  }

  return (
    <section className='space-y-3'>
      <div className='flex items-center gap-2.5 border border-amber-500/30 bg-amber-950/20 px-3 py-2.5'>
        <img
          alt=''
          aria-hidden
          className='h-12 w-12 shrink-0 -scale-x-100 object-contain'
          src={emojiWke}
        />
        <p className='text-[11px] leading-relaxed text-amber-100/75'>
          <strong className='font-semibold text-amber-200/90'>Work in Progress:</strong> This
          database is still being built! Expect improvements to functionality, styling and Yes(!)
          the popup is very ugly and needs big work. Thanks for your patience!
        </p>
      </div>

      <div className='space-y-3'>
        <DatabaseEntityTabs activeEntity={activeEntity} search={location.search} />

        {activeEntity === 'wheels' ? (
          <WheelsDatabaseSection
            browseState={wheelBrowseState}
            filteredCount={wheelViewModel.wheels.length}
            onSelectWheel={openWheelDetail}
            searchInputRef={searchInputRef}
            totalCount={wheelViewModel.totalCount}
            wheels={wheelViewModel.wheels}
          />
        ) : (
          <>
            <DatabaseFilters
              filteredCount={awakenerViewModel.awakeners.length}
              groupByRealm={awakenerBrowseState.groupByRealm}
              onGroupByRealmChange={awakenerBrowseState.setGroupByRealm}
              onQueryChange={awakenerBrowseState.setQuery}
              onRarityFilterChange={awakenerBrowseState.setRarityFilter}
              onRealmFilterChange={awakenerBrowseState.setRealmFilter}
              onSortDirectionToggle={awakenerBrowseState.toggleSortDirection}
              onSortKeyChange={awakenerBrowseState.setSortKey}
              onTypeFilterChange={awakenerBrowseState.setTypeFilter}
              query={awakenerBrowseState.query}
              rarityFilter={awakenerBrowseState.rarityFilter}
              realmFilter={awakenerBrowseState.realmFilter}
              searchInputRef={searchInputRef}
              sortDirection={awakenerBrowseState.sortDirection}
              sortKey={awakenerBrowseState.sortKey}
              totalCount={awakenerViewModel.totalCount}
              typeFilter={awakenerBrowseState.typeFilter}
            />

            <DatabaseGrid
              awakeners={awakenerViewModel.awakeners}
              onSelectAwakener={openAwakenerDetail}
            />
          </>
        )}
      </div>

      {selectedAwakener ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading awakener details...</div>
          }
        >
          <DatabaseAwakenerDetailRoute
            activeTab={selectedTab}
            awakener={selectedAwakener}
            awakeners={databaseAwakeners}
            onClose={closeDetail}
            onSelectAwakener={handleModalAwakenerSelect}
            onSelectWheel={handleModalWheelSelect}
            onTabChange={handleDetailTabChange}
            tabSlug={tabSlug}
          />
        </Suspense>
      ) : null}

      {selectedWheel ? (
        <Suspense
          fallback={
            <div className='px-2 py-3 text-sm text-slate-300'>Loading wheel details...</div>
          }
        >
          <DatabaseWheelDetailRoute
            onClose={closeDetail}
            onSelectAwakener={handleModalAwakenerSelect}
            onSelectWheel={handleModalWheelSelect}
            wheel={selectedWheel}
            wheels={databaseWheels}
          />
        </Suspense>
      ) : null}
    </section>
  )
}

interface DatabaseAwakenerDetailRouteProps {
  activeTab: DatabaseAwakenerTab
  awakener: Awakener
  awakeners: Awakener[]
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel: (wheel: Pick<Wheel, 'name'>) => void
  onTabChange: (tab: DatabaseAwakenerTab) => void
  tabSlug?: string
}

function DatabaseAwakenerDetailRoute({
  activeTab,
  awakener,
  awakeners,
  onClose,
  onSelectAwakener,
  onSelectWheel,
  onTabChange,
  tabSlug,
}: DatabaseAwakenerDetailRouteProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const {isLoading, record: fullDataV2} = useDatabaseDetailRouteRecord({
    id: awakener.id,
    loadRecord: loadAwakenerFullV2ById,
    missingPathname: buildDatabaseEntityBrowsePath('awakeners'),
  })

  useEffect(() => {
    if (!fullDataV2 || !tabSlug || resolveDatabaseAwakenerTab(tabSlug)) {
      return
    }

    void navigate(
      {
        pathname: buildDatabaseAwakenerPath(awakener),
        search: location.search,
      },
      {replace: true},
    )
  }, [awakener, fullDataV2, location.search, navigate, tabSlug])

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>Loading awakener details...</div>
  }

  if (!fullDataV2) {
    return null
  }

  return (
    <AwakenerDetailModal
      activeTab={activeTab}
      awakener={awakener}
      awakeners={awakeners}
      fullDataV2={fullDataV2}
      key={awakener.id}
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
      onSelectWheel={onSelectWheel}
      onTabChange={onTabChange}
    />
  )
}

interface DatabaseWheelDetailRouteProps {
  wheel: Wheel
  wheels: Wheel[]
  onClose: () => void
  onSelectAwakener: (awakener: Pick<Awakener, 'id' | 'name'>, tab?: DatabaseAwakenerTab) => void
  onSelectWheel?: (wheel: Pick<Wheel, 'name'>) => void
}

function DatabaseWheelDetailRoute({
  wheel,
  wheels,
  onClose,
  onSelectAwakener,
  onSelectWheel,
}: DatabaseWheelDetailRouteProps) {
  const {isLoading, record: fullDataV1} = useDatabaseDetailRouteRecord({
    id: wheel.id,
    loadRecord: loadWheelFullV1ById,
    missingPathname: buildDatabaseWheelBrowsePath(),
  })

  if (isLoading) {
    return <div className='px-2 py-3 text-sm text-slate-300'>Loading wheel details...</div>
  }

  if (!fullDataV1) {
    return null
  }

  return (
    <WheelDetailModal
      fullDataV1={fullDataV1}
      key={wheel.id}
      onClose={onClose}
      onSelectAwakener={onSelectAwakener}
      onSelectWheel={onSelectWheel}
      wheel={wheel}
      wheels={wheels}
    />
  )
}
