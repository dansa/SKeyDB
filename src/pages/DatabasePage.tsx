import {lazy, Suspense, useEffect, useRef} from 'react'

import {useLocation, useNavigate, useParams} from 'react-router-dom'

import emojiWke from '@/assets/emoji/Emoji_WKE_S_06.webp'
import {getAwakeners, type Awakener} from '@/domain/awakeners'
import {loadAwakenerFullV2ById} from '@/domain/awakeners-full-v2-loader'
import {DATABASE_SORT_OPTIONS, type DatabaseSortKey} from '@/domain/database-browse-state'
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
import {
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'
import {loadWheelFullV1ById} from '@/domain/wheels-full-v1-loader'

import {
  buildAwakenerActiveFilterChips,
  buildWheelActiveFilterChips,
} from './database/database-active-filter-chips'
import {DatabaseBrowseLayout} from './database/DatabaseBrowseLayout'
import {DatabaseFilters} from './database/DatabaseFilters'
import {DatabaseGrid} from './database/DatabaseGrid'
import {EntityViewControls} from './database/EntityViewControls'
import {useDatabaseBrowseState} from './database/useDatabaseBrowseState'
import {useDatabaseDetailRouteRecord} from './database/useDatabaseDetailRouteRecord'
import {useDatabaseViewModel} from './database/useDatabaseViewModel'
import {useWheelsDatabaseBrowseState} from './database/useWheelsDatabaseBrowseState'
import {useWheelsDatabaseViewModel} from './database/useWheelsDatabaseViewModel'
import {WheelDatabaseFilters} from './database/WheelDatabaseFilters'
import {WheelGrid} from './database/WheelGrid'
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

function getDatabaseSortLabel(sortKey: DatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'ATK') {
    return 'ATK'
  }
  if (sortKey === 'DEF') {
    return 'DEF'
  }
  if (sortKey === 'CON') {
    return 'CON'
  }
  return 'Alphabetical'
}

function getDatabaseSortDirectionLabel(
  sortKey: DatabaseSortKey,
  direction: 'ASC' | 'DESC',
): string {
  if (sortKey === 'ALPHABETICAL') {
    return direction === 'ASC' ? 'A -> Z' : 'Z -> A'
  }
  return direction === 'ASC' ? 'Low -> High' : 'High -> Low'
}

function getWheelSortLabel(sortKey: WheelsDatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'MAINSTAT') {
    return 'Main stat'
  }
  return 'Alphabetical'
}

function getWheelSortDirectionLabel(
  sortKey: WheelsDatabaseSortKey,
  direction: 'ASC' | 'DESC',
): string {
  if (sortKey === 'RARITY') {
    return direction === 'ASC' ? 'Low -> High' : 'High -> Low'
  }
  return direction === 'ASC' ? 'A -> Z' : 'Z -> A'
}

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

  const awakenerActiveFilterChips = buildAwakenerActiveFilterChips(awakenerBrowseState, {
    clearQuery: awakenerBrowseState.clearQuery,
    setRealmFilter: awakenerBrowseState.setRealmFilter,
    setRarityFilter: awakenerBrowseState.setRarityFilter,
    setTypeFilter: awakenerBrowseState.setTypeFilter,
  })
  const wheelActiveFilterChips = buildWheelActiveFilterChips(wheelBrowseState, {
    clearQuery: wheelBrowseState.clearQuery,
    setRealmFilter: wheelBrowseState.setRealmFilter,
    setRarityFilter: wheelBrowseState.setRarityFilter,
    setMainstatFilter: wheelBrowseState.setMainstatFilter,
  })

  return (
    <section className='space-y-2.5 sm:space-y-3'>
      <div className='flex items-start gap-2.5 rounded-sm border border-amber-400/20 bg-[linear-gradient(180deg,rgba(120,53,15,0.18),rgba(69,26,3,0.12))] px-2.5 py-2 sm:items-center sm:gap-3 sm:px-3 sm:py-2.5'>
        <img
          alt=''
          aria-hidden
          className='h-9 w-9 shrink-0 -scale-x-100 object-contain sm:h-12 sm:w-12'
          src={emojiWke}
        />
        <p className='text-xs leading-normal text-amber-100/75'>
          <strong className='font-semibold text-amber-200/90'>Database beta:</strong> Search,
          filters, and detail views are live. We&apos;re still filling in data and polishing the UI,
          so some entries and interactions may shift.
        </p>
      </div>

      {activeEntity === 'wheels' ? (
        <DatabaseBrowseLayout
          activeEntity={activeEntity}
          activeFilterChips={wheelActiveFilterChips}
          filteredCount={wheelViewModel.wheels.length}
          filters={
            <WheelDatabaseFilters
              mainstatFilter={wheelBrowseState.mainstatFilter}
              onMainstatFilterChange={wheelBrowseState.setMainstatFilter}
              onQueryChange={wheelBrowseState.setQuery}
              onRarityFilterChange={wheelBrowseState.setRarityFilter}
              onRealmFilterChange={wheelBrowseState.setRealmFilter}
              query={wheelBrowseState.query}
              rarityFilter={wheelBrowseState.rarityFilter}
              realmFilter={wheelBrowseState.realmFilter}
              searchInputRef={searchInputRef}
            />
          }
          onResetFilters={wheelBrowseState.resetFilters}
          results={<WheelGrid onSelectWheel={openWheelDetail} wheels={wheelViewModel.wheels} />}
          search={location.search}
          title='Wheels'
          totalCount={wheelViewModel.totalCount}
          unitNoun='wheels'
          viewControls={
            <EntityViewControls
              getSortDirectionLabel={getWheelSortDirectionLabel}
              getSortLabel={getWheelSortLabel}
              onSortDirectionToggle={wheelBrowseState.toggleSortDirection}
              onSortKeyChange={wheelBrowseState.setSortKey}
              sortDirection={wheelBrowseState.sortDirection}
              sortDirectionAriaLabel='Toggle wheel sort direction'
              sortKey={wheelBrowseState.sortKey}
              sortOptions={WHEELS_DATABASE_SORT_OPTIONS}
              sortSelectAriaLabel='Wheel database sort key'
            />
          }
        />
      ) : (
        <DatabaseBrowseLayout
          activeEntity={activeEntity}
          activeFilterChips={awakenerActiveFilterChips}
          filteredCount={awakenerViewModel.awakeners.length}
          filters={
            <DatabaseFilters
              onQueryChange={awakenerBrowseState.setQuery}
              onRarityFilterChange={awakenerBrowseState.setRarityFilter}
              onRealmFilterChange={awakenerBrowseState.setRealmFilter}
              onTypeFilterChange={awakenerBrowseState.setTypeFilter}
              query={awakenerBrowseState.query}
              rarityFilter={awakenerBrowseState.rarityFilter}
              realmFilter={awakenerBrowseState.realmFilter}
              searchInputRef={searchInputRef}
              typeFilter={awakenerBrowseState.typeFilter}
            />
          }
          onResetFilters={awakenerBrowseState.resetFilters}
          results={
            <DatabaseGrid
              awakeners={awakenerViewModel.awakeners}
              onSelectAwakener={openAwakenerDetail}
            />
          }
          search={location.search}
          title='Awakeners'
          totalCount={awakenerViewModel.totalCount}
          unitNoun='awakeners'
          viewControls={
            <EntityViewControls
              getSortDirectionLabel={getDatabaseSortDirectionLabel}
              getSortLabel={getDatabaseSortLabel}
              groupByRealm={awakenerBrowseState.groupByRealm}
              onGroupByRealmChange={awakenerBrowseState.setGroupByRealm}
              onSortDirectionToggle={awakenerBrowseState.toggleSortDirection}
              onSortKeyChange={awakenerBrowseState.setSortKey}
              sortDirection={awakenerBrowseState.sortDirection}
              sortDirectionAriaLabel='Toggle database sort direction'
              sortKey={awakenerBrowseState.sortKey}
              sortOptions={DATABASE_SORT_OPTIONS}
              sortSelectAriaLabel='Database sort key'
            />
          }
        />
      )}

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
