import {useMemo, type ComponentType, type ReactNode} from 'react'

import {searchCovenants} from '@/domain/covenants-search'
import {DATABASE_SORT_OPTIONS} from '@/domain/database-browse-state'
import {isPrimordialMemoryPosse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {RELIC_DATABASE_SORT_OPTIONS} from '@/domain/relic-database-browse-state'
import {mergeRelicDisplayScopesForMatches} from '@/domain/relic-database-display-scopes'
import {buildRelicDatabaseViewResult} from '@/domain/relic-database-view'
import {WHEELS_DATABASE_SORT_OPTIONS} from '@/domain/wheels-database-browse-state'
import type {DatabaseDetailResultSet} from '@/features/database/detail/database-detail-result-navigation'
import {
  createAwakenerDetailResultSet,
  createCovenantDetailResultSet,
  createPosseDetailResultSet,
  createRelicDetailResultSet,
  createWheelDetailResultSet,
} from '@/features/database/detail/database-detail-result-set'
import {
  buildAwakenerActiveFilterChips,
  buildCovenantActiveFilterChips,
  buildPosseActiveFilterChips,
  buildRelicActiveFilterChips,
  buildWheelActiveFilterChips,
} from '@/features/database/internal/database-active-filter-chips'
import {DatabaseFilters} from '@/features/database/internal/DatabaseFilters'
import {DatabaseGrid} from '@/features/database/internal/DatabaseGrid'
import {EntityViewControls} from '@/features/database/internal/EntityViewControls'
import {RelicDatabaseFilters} from '@/features/database/internal/RelicDatabaseFilters'
import {RelicGrid} from '@/features/database/internal/RelicGrid'
import {
  CovenantDatabaseFilters,
  PosseDatabaseFilters,
} from '@/features/database/internal/SimpleArtifactFilters'
import {CovenantGrid, PosseGrid} from '@/features/database/internal/SimpleArtifactGrid'
import {useDatabaseViewModel} from '@/features/database/internal/useDatabaseViewModel'
import {useWheelsDatabaseViewModel} from '@/features/database/internal/useWheelsDatabaseViewModel'
import {WheelDatabaseFilters} from '@/features/database/internal/WheelDatabaseFilters'
import {WheelGrid} from '@/features/database/internal/WheelGrid'
import type {ActiveFilterChip} from '@/ui/filters/ActiveFilterChips'
import {useGlobalSearchCapture} from '@/ui/search/useGlobalSearchCapture'

import {
  databaseAwakeners,
  databaseCovenants,
  databasePosses,
  databaseRelics,
  databaseWheels,
} from '../data'
import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import {
  getDatabaseSortDirectionLabel,
  getDatabaseSortLabel,
  getRelicSortDirectionLabel,
  getRelicSortLabel,
  getWheelSortDirectionLabel,
  getWheelSortLabel,
} from './databaseBrowseSortLabels'
import {useDatabaseBrowseState} from './useDatabaseBrowseState'
import type {EntityBrowseController, EntitySearchActions} from './useEntityBrowseController'
import {useRelicsDatabaseBrowseState} from './useRelicsDatabaseBrowseState'
import {
  useCovenantDatabaseBrowseState,
  usePosseDatabaseBrowseState,
} from './useSimpleArtifactDatabaseBrowseState'
import {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'

interface EntityBrowseProps {
  controller: EntityBrowseController
  DetailModalHost?: ComponentType<{resultSet: DatabaseDetailResultSet}>
  renderDetailModalHost?: (resultSet: DatabaseDetailResultSet) => ReactNode
}

function useActiveGlobalSearchCapture(
  controller: EntityBrowseController,
  searchActions: EntitySearchActions,
) {
  useGlobalSearchCapture({
    enabled: !controller.isDetailOpen,
    searchInputRef: controller.searchInputRef,
    onAppendCharacter: searchActions.appendSearchCharacter,
    onRemoveCharacter: searchActions.removeSearchCharacter,
    onClearSearch: searchActions.clearQuery,
  })
}

interface SimpleArtifactBrowseLayoutOptions {
  activeEntity: 'posses' | 'covenants'
  activeFilterChips: readonly ActiveFilterChip[]
  filteredCount: number
  filters: ReactNode
  onResetFilters: () => void
  results: ReactNode
  search: string
  title: string
  totalCount: number
  unitNoun: string
}

function SimpleArtifactBrowseLayout({
  activeEntity,
  activeFilterChips,
  filteredCount,
  filters,
  onResetFilters,
  results,
  search,
  title,
  totalCount,
  unitNoun,
}: SimpleArtifactBrowseLayoutOptions): ReactNode {
  return (
    <DatabaseBrowseLayout
      activeEntity={activeEntity}
      activeFilterChips={activeFilterChips}
      filteredCount={filteredCount}
      filters={filters}
      onResetFilters={onResetFilters}
      results={results}
      search={search}
      title={title}
      totalCount={totalCount}
      unitNoun={unitNoun}
      viewControls={null}
    />
  )
}

function DetailModalHostSlot({
  DetailModalHost,
  renderDetailModalHost,
  resultSet,
}: {
  DetailModalHost?: ComponentType<{resultSet: DatabaseDetailResultSet}>
  renderDetailModalHost?: (resultSet: DatabaseDetailResultSet) => ReactNode
  resultSet: DatabaseDetailResultSet
}): ReactNode {
  if (DetailModalHost) {
    return <DetailModalHost resultSet={resultSet} />
  }
  return renderDetailModalHost?.(resultSet) ?? null
}

export function AwakenersBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useDatabaseBrowseState()
  const viewModel = useDatabaseViewModel(databaseAwakeners, browseState)
  const activeFilterChips = buildAwakenerActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
    setRealmFilter: browseState.setRealmFilter,
    setRarityFilter: browseState.setRarityFilter,
    setTypeFilter: browseState.setTypeFilter,
    setAvailabilityFilter: browseState.setAvailabilityFilter,
    setGameplayFactionFilters: browseState.setGameplayFactionFilters,
    setScalingSubstatFilters: browseState.setScalingSubstatFilters,
  })
  const detailResultSet = useMemo(
    () => createAwakenerDetailResultSet(viewModel.awakeners),
    [viewModel.awakeners],
  )

  useActiveGlobalSearchCapture(controller, browseState)

  const filters = useMemo(
    () => (
      <DatabaseFilters
        onQueryChange={browseState.setQuery}
        onAvailabilityFilterChange={browseState.setAvailabilityFilter}
        onRarityFilterChange={browseState.setRarityFilter}
        onRealmFilterChange={browseState.setRealmFilter}
        onTypeFilterChange={browseState.setTypeFilter}
        onGameplayFactionFilterToggle={browseState.toggleGameplayFactionFilter}
        onScalingSubstatFilterRemove={browseState.removeScalingSubstatFilter}
        onScalingSubstatFilterRoleChange={browseState.setScalingSubstatFilterRole}
        onScalingSubstatFilterToggle={browseState.toggleScalingSubstatFilter}
        query={browseState.query}
        availabilityFilter={browseState.availabilityFilter}
        gameplayFactionFilters={browseState.gameplayFactionFilters}
        rarityFilter={browseState.rarityFilter}
        realmFilter={browseState.realmFilter}
        scalingSubstatFilters={browseState.scalingSubstatFilters}
        searchInputRef={controller.searchInputRef}
        typeFilter={browseState.typeFilter}
      />
    ),
    [
      browseState.availabilityFilter,
      browseState.gameplayFactionFilters,
      browseState.query,
      browseState.rarityFilter,
      browseState.realmFilter,
      browseState.removeScalingSubstatFilter,
      browseState.scalingSubstatFilters,
      browseState.setAvailabilityFilter,
      browseState.setQuery,
      browseState.setRarityFilter,
      browseState.setRealmFilter,
      browseState.setScalingSubstatFilterRole,
      browseState.setTypeFilter,
      browseState.toggleGameplayFactionFilter,
      browseState.toggleScalingSubstatFilter,
      browseState.typeFilter,
      controller.searchInputRef,
    ],
  )
  const results = useMemo(
    () => (
      <DatabaseGrid
        availabilityFilter={browseState.availabilityFilter}
        awakeners={viewModel.awakeners}
        onPreloadAwakener={controller.preloadAwakenerDetail}
        onSelectAwakener={controller.openAwakenerDetail}
        rarityFilter={browseState.rarityFilter}
        scalingSubstatFilters={browseState.scalingSubstatFilters}
        sortKey={browseState.sortKey}
      />
    ),
    [
      browseState.availabilityFilter,
      browseState.rarityFilter,
      browseState.scalingSubstatFilters,
      browseState.sortKey,
      controller.openAwakenerDetail,
      controller.preloadAwakenerDetail,
      viewModel.awakeners,
    ],
  )
  const viewControls = useMemo(
    () => (
      <EntityViewControls
        getSortDirectionLabel={getDatabaseSortDirectionLabel}
        getSortLabel={getDatabaseSortLabel}
        groupByRealm={browseState.groupByRealm}
        onGroupByRealmChange={browseState.setGroupByRealm}
        onSortDirectionToggle={browseState.toggleSortDirection}
        onSortKeyChange={browseState.setSortKey}
        sortDirection={browseState.sortDirection}
        sortDirectionAriaLabel='Toggle database sort direction'
        sortKey={browseState.sortKey}
        sortOptions={DATABASE_SORT_OPTIONS}
        sortSelectAriaLabel='Database sort key'
      />
    ),
    [
      browseState.groupByRealm,
      browseState.setGroupByRealm,
      browseState.setSortKey,
      browseState.sortDirection,
      browseState.sortKey,
      browseState.toggleSortDirection,
    ],
  )

  return (
    <>
      <DatabaseBrowseLayout
        activeEntity='awakeners'
        activeFilterChips={activeFilterChips}
        filteredCount={viewModel.awakeners.length}
        filters={filters}
        onResetFilters={browseState.resetFilters}
        results={results}
        search={controller.activeSearch}
        title='Awakeners'
        totalCount={viewModel.totalCount}
        unitNoun='awakeners'
        viewControls={viewControls}
      />
      <DetailModalHostSlot
        DetailModalHost={DetailModalHost}
        renderDetailModalHost={renderDetailModalHost}
        resultSet={detailResultSet}
      />
    </>
  )
}

export function WheelsBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useWheelsDatabaseBrowseState()
  const viewModel = useWheelsDatabaseViewModel(databaseWheels, browseState)
  const activeFilterChips = buildWheelActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
    setRealmFilter: browseState.setRealmFilter,
    setRarityFilter: browseState.setRarityFilter,
    setMainstatFilter: browseState.setMainstatFilter,
  })
  const detailResultSet = useMemo(
    () => createWheelDetailResultSet(viewModel.wheels),
    [viewModel.wheels],
  )

  useActiveGlobalSearchCapture(controller, browseState)

  const filters = useMemo(
    () => (
      <WheelDatabaseFilters
        mainstatFilter={browseState.mainstatFilter}
        onMainstatFilterChange={browseState.setMainstatFilter}
        onQueryChange={browseState.setQuery}
        onRarityFilterChange={browseState.setRarityFilter}
        onRealmFilterChange={browseState.setRealmFilter}
        query={browseState.query}
        rarityFilter={browseState.rarityFilter}
        realmFilter={browseState.realmFilter}
        searchInputRef={controller.searchInputRef}
      />
    ),
    [
      browseState.mainstatFilter,
      browseState.query,
      browseState.rarityFilter,
      browseState.realmFilter,
      browseState.setMainstatFilter,
      browseState.setQuery,
      browseState.setRarityFilter,
      browseState.setRealmFilter,
      controller.searchInputRef,
    ],
  )
  const results = useMemo(
    () => (
      <WheelGrid
        onPreloadWheel={controller.preloadWheelDetail}
        onSelectWheel={controller.openWheelDetail}
        wheels={viewModel.wheels}
      />
    ),
    [controller.openWheelDetail, controller.preloadWheelDetail, viewModel.wheels],
  )
  const viewControls = useMemo(
    () => (
      <EntityViewControls
        getSortDirectionLabel={getWheelSortDirectionLabel}
        getSortLabel={getWheelSortLabel}
        onSortDirectionToggle={browseState.toggleSortDirection}
        onSortKeyChange={browseState.setSortKey}
        sortDirection={browseState.sortDirection}
        sortDirectionAriaLabel='Toggle wheel sort direction'
        sortKey={browseState.sortKey}
        sortOptions={WHEELS_DATABASE_SORT_OPTIONS}
        sortSelectAriaLabel='Wheel database sort key'
      />
    ),
    [
      browseState.setSortKey,
      browseState.sortDirection,
      browseState.sortKey,
      browseState.toggleSortDirection,
    ],
  )

  return (
    <>
      <DatabaseBrowseLayout
        activeEntity='wheels'
        activeFilterChips={activeFilterChips}
        filteredCount={viewModel.wheels.length}
        filters={filters}
        onResetFilters={browseState.resetFilters}
        results={results}
        search={controller.activeSearch}
        title='Wheels'
        totalCount={viewModel.totalCount}
        unitNoun='wheels'
        viewControls={viewControls}
      />
      <DetailModalHostSlot
        DetailModalHost={DetailModalHost}
        renderDetailModalHost={renderDetailModalHost}
        resultSet={detailResultSet}
      />
    </>
  )
}

export function RelicsBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useRelicsDatabaseBrowseState()
  const {displayScopes, query, setDisplayScopes} = browseState
  const viewModel = useMemo(
    () =>
      buildRelicDatabaseViewResult(
        databaseRelics,
        {
          categoryFilter: browseState.categoryFilter,
          query: browseState.query,
          sortDirection: browseState.sortDirection,
          sortKey: browseState.sortKey,
          tierFilter: browseState.tierFilter,
        },
        {displayScopes: browseState.displayScopes},
      ),
    [
      browseState.categoryFilter,
      browseState.displayScopes,
      browseState.query,
      browseState.sortDirection,
      browseState.sortKey,
      browseState.tierFilter,
    ],
  )
  const relics = viewModel.relics
  const hasExplicitMatchRequest =
    query.trim().length > 0 ||
    browseState.categoryFilter !== 'ALL' ||
    browseState.tierFilter !== 'ALL'
  const activeFilterChips = buildRelicActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
    setCategoryFilter: browseState.setCategoryFilter,
    setTierFilter: browseState.setTierFilter,
  })
  const detailResultSet = useMemo(() => createRelicDetailResultSet(relics), [relics])
  const filters = useMemo(
    () => (
      <RelicDatabaseFilters
        categoryFilter={browseState.categoryFilter}
        displayScopes={browseState.displayScopes}
        onCategoryFilterChange={browseState.setCategoryFilter}
        onDisplayScopeToggle={browseState.toggleDisplayScope}
        onQueryChange={browseState.setQuery}
        onTierFilterChange={browseState.setTierFilter}
        query={browseState.query}
        searchInputRef={controller.searchInputRef}
        tierFilter={browseState.tierFilter}
      />
    ),
    [
      browseState.categoryFilter,
      browseState.displayScopes,
      browseState.query,
      browseState.setCategoryFilter,
      browseState.setQuery,
      browseState.setTierFilter,
      browseState.tierFilter,
      browseState.toggleDisplayScope,
      controller.searchInputRef,
    ],
  )
  const results = useMemo(
    () => (
      <div className='space-y-3'>
        {hasExplicitMatchRequest && viewModel.hiddenByDisplayCount > 0 ? (
          <div className='flex min-h-10 flex-wrap items-center justify-between gap-2 border border-slate-700/65 bg-slate-950/48 px-3 py-2 text-xs text-slate-400'>
            <span>
              <span className='font-medium text-slate-200 tabular-nums'>
                {viewModel.hiddenByDisplayCount}
              </span>{' '}
              matching {viewModel.hiddenByDisplayCount === 1 ? 'relic is' : 'relics are'} hidden by
              Display.
            </span>
            <button
              className='ui-compact-control min-h-10 text-xs text-amber-100 sm:min-h-8'
              onClick={() => {
                setDisplayScopes(
                  mergeRelicDisplayScopesForMatches(displayScopes, viewModel.hiddenByDisplay),
                )
              }}
              type='button'
            >
              Show hidden matches
            </button>
          </div>
        ) : null}
        <RelicGrid
          awakeners={databaseAwakeners}
          onPreloadRelic={controller.preloadRelicDetail}
          onSelectRelic={controller.openRelicDetail}
          relics={relics}
        />
      </div>
    ),
    [
      controller.openRelicDetail,
      controller.preloadRelicDetail,
      displayScopes,
      hasExplicitMatchRequest,
      relics,
      setDisplayScopes,
      viewModel.hiddenByDisplay,
      viewModel.hiddenByDisplayCount,
    ],
  )
  const viewControls = useMemo(
    () => (
      <EntityViewControls
        getSortDirectionLabel={getRelicSortDirectionLabel}
        getSortLabel={getRelicSortLabel}
        onSortDirectionToggle={browseState.toggleSortDirection}
        onSortKeyChange={browseState.setSortKey}
        sortDirection={browseState.sortDirection}
        sortDirectionAriaLabel='Toggle relic sort direction'
        sortKey={browseState.sortKey}
        sortOptions={RELIC_DATABASE_SORT_OPTIONS}
        sortSelectAriaLabel='Relic database sort key'
      />
    ),
    [
      browseState.setSortKey,
      browseState.sortDirection,
      browseState.sortKey,
      browseState.toggleSortDirection,
    ],
  )

  useActiveGlobalSearchCapture(controller, browseState)

  return (
    <>
      <DatabaseBrowseLayout
        activeEntity='relics'
        activeFilterChips={activeFilterChips}
        filteredCount={relics.length}
        filters={filters}
        onResetFilters={browseState.resetFilters}
        results={results}
        search={controller.activeSearch}
        title='Relics'
        totalCount={databaseRelics.length}
        unitNoun='relics'
        viewControls={viewControls}
      />
      <DetailModalHostSlot
        DetailModalHost={DetailModalHost}
        renderDetailModalHost={renderDetailModalHost}
        resultSet={detailResultSet}
      />
    </>
  )
}

export function PossesBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = usePosseDatabaseBrowseState()
  const records = useMemo(() => {
    const searched = searchPosses(databasePosses, browseState.query)
    const byType = searched.filter((posse) => {
      if (browseState.typeFilter === 'ALL') return true
      if (browseState.typeFilter === 'PRIMORDIAL_MEMORY') {
        return isPrimordialMemoryPosse(posse)
      }
      return !isPrimordialMemoryPosse(posse)
    })
    const byRealm =
      browseState.realmFilter === 'ALL'
        ? byType
        : byType.filter((posse) => posse.realm === browseState.realmFilter)
    return browseState.typeFilter === 'ALL'
      ? byRealm.toSorted(
          (left, right) =>
            Number(isPrimordialMemoryPosse(left)) - Number(isPrimordialMemoryPosse(right)),
        )
      : byRealm
  }, [browseState.query, browseState.realmFilter, browseState.typeFilter])
  const activeFilterChips = buildPosseActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
    setRealmFilter: browseState.setRealmFilter,
    setTypeFilter: browseState.setTypeFilter,
  })
  const detailResultSet = useMemo(() => createPosseDetailResultSet(records), [records])

  useActiveGlobalSearchCapture(controller, browseState)

  const filters = useMemo(
    () => (
      <PosseDatabaseFilters
        onQueryChange={browseState.setQuery}
        onRealmFilterChange={browseState.setRealmFilter}
        onTypeFilterChange={browseState.setTypeFilter}
        query={browseState.query}
        realmFilter={browseState.realmFilter}
        typeFilter={browseState.typeFilter}
        searchInputRef={controller.searchInputRef}
      />
    ),
    [
      browseState.query,
      browseState.realmFilter,
      browseState.typeFilter,
      browseState.setQuery,
      browseState.setRealmFilter,
      browseState.setTypeFilter,
      controller.searchInputRef,
    ],
  )
  const results = useMemo(
    () => (
      <PosseGrid
        onPreloadPosse={controller.preloadPosseDetail}
        onSelectPosse={controller.openPosseDetail}
        posses={records}
      />
    ),
    [controller.openPosseDetail, controller.preloadPosseDetail, records],
  )

  return (
    <>
      <SimpleArtifactBrowseLayout
        activeEntity='posses'
        activeFilterChips={activeFilterChips}
        filteredCount={records.length}
        filters={filters}
        onResetFilters={browseState.resetFilters}
        results={results}
        search={controller.activeSearch}
        title='Posses'
        totalCount={databasePosses.length}
        unitNoun='posses'
      />
      <DetailModalHostSlot
        DetailModalHost={DetailModalHost}
        renderDetailModalHost={renderDetailModalHost}
        resultSet={detailResultSet}
      />
    </>
  )
}

export function CovenantsBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useCovenantDatabaseBrowseState()
  const records = useMemo(
    () => searchCovenants(databaseCovenants, browseState.query),
    [browseState.query],
  )
  const activeFilterChips = buildCovenantActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
  })
  const detailResultSet = useMemo(() => createCovenantDetailResultSet(records), [records])

  useActiveGlobalSearchCapture(controller, browseState)

  const filters = useMemo(
    () => (
      <CovenantDatabaseFilters
        onQueryChange={browseState.setQuery}
        query={browseState.query}
        searchInputRef={controller.searchInputRef}
      />
    ),
    [browseState.query, browseState.setQuery, controller.searchInputRef],
  )
  const results = useMemo(
    () => (
      <CovenantGrid
        covenants={records}
        onPreloadCovenant={controller.preloadCovenantDetail}
        onSelectCovenant={controller.openCovenantDetail}
      />
    ),
    [controller.openCovenantDetail, controller.preloadCovenantDetail, records],
  )

  return (
    <>
      <SimpleArtifactBrowseLayout
        activeEntity='covenants'
        activeFilterChips={activeFilterChips}
        filteredCount={records.length}
        filters={filters}
        onResetFilters={browseState.resetFilters}
        results={results}
        search={controller.activeSearch}
        title='Covenants'
        totalCount={databaseCovenants.length}
        unitNoun='covenants'
      />
      <DetailModalHostSlot
        DetailModalHost={DetailModalHost}
        renderDetailModalHost={renderDetailModalHost}
        resultSet={detailResultSet}
      />
    </>
  )
}
