import {useMemo, type ReactNode} from 'react'

import {searchCovenants} from '@/domain/covenants-search'
import {DATABASE_SORT_OPTIONS} from '@/domain/database-browse-state'
import {searchPosses} from '@/domain/posses-search'
import {WHEELS_DATABASE_SORT_OPTIONS} from '@/domain/wheels-database-browse-state'
import {
  buildAwakenerActiveFilterChips,
  buildCovenantActiveFilterChips,
  buildPosseActiveFilterChips,
  buildWheelActiveFilterChips,
} from '@/features/database/internal/database-active-filter-chips'
import {DatabaseFilters} from '@/features/database/internal/DatabaseFilters'
import {DatabaseGrid} from '@/features/database/internal/DatabaseGrid'
import {EntityViewControls} from '@/features/database/internal/EntityViewControls'
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

import {databaseAwakeners, databaseCovenants, databasePosses, databaseWheels} from '../data'
import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import {
  getDatabaseSortDirectionLabel,
  getDatabaseSortLabel,
  getWheelSortDirectionLabel,
  getWheelSortLabel,
} from './databaseBrowseSortLabels'
import {useDatabaseBrowseState} from './useDatabaseBrowseState'
import type {EntityBrowseController, EntitySearchActions} from './useEntityBrowseController'
import {
  useCovenantDatabaseBrowseState,
  usePosseDatabaseBrowseState,
} from './useSimpleArtifactDatabaseBrowseState'
import {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'

interface EntityBrowseProps {
  controller: EntityBrowseController
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

function renderSimpleArtifactBrowseLayout({
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

export function AwakenersBrowse({controller}: EntityBrowseProps): ReactNode {
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

  useActiveGlobalSearchCapture(controller, browseState)

  return (
    <DatabaseBrowseLayout
      activeEntity='awakeners'
      activeFilterChips={activeFilterChips}
      filteredCount={viewModel.awakeners.length}
      filters={
        <DatabaseFilters
          onQueryChange={browseState.setQuery}
          onAvailabilityFilterChange={browseState.setAvailabilityFilter}
          onRarityFilterChange={browseState.setRarityFilter}
          onRealmFilterChange={browseState.setRealmFilter}
          onTypeFilterChange={browseState.setTypeFilter}
          onGameplayFactionFilterToggle={browseState.toggleGameplayFactionFilter}
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
      }
      onResetFilters={browseState.resetFilters}
      results={
        <DatabaseGrid
          awakeners={viewModel.awakeners}
          onSelectAwakener={controller.openAwakenerDetail}
        />
      }
      search={controller.activeSearch}
      title='Awakeners'
      totalCount={viewModel.totalCount}
      unitNoun='awakeners'
      viewControls={
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
      }
    />
  )
}

export function WheelsBrowse({controller}: EntityBrowseProps): ReactNode {
  const browseState = useWheelsDatabaseBrowseState()
  const viewModel = useWheelsDatabaseViewModel(databaseWheels, browseState)
  const activeFilterChips = buildWheelActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
    setRealmFilter: browseState.setRealmFilter,
    setRarityFilter: browseState.setRarityFilter,
    setMainstatFilter: browseState.setMainstatFilter,
  })

  useActiveGlobalSearchCapture(controller, browseState)

  return (
    <DatabaseBrowseLayout
      activeEntity='wheels'
      activeFilterChips={activeFilterChips}
      filteredCount={viewModel.wheels.length}
      filters={
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
      }
      onResetFilters={browseState.resetFilters}
      results={<WheelGrid onSelectWheel={controller.openWheelDetail} wheels={viewModel.wheels} />}
      search={controller.activeSearch}
      title='Wheels'
      totalCount={viewModel.totalCount}
      unitNoun='wheels'
      viewControls={
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
      }
    />
  )
}

export function PossesBrowse({controller}: EntityBrowseProps): ReactNode {
  const browseState = usePosseDatabaseBrowseState()
  const records = useMemo(() => {
    const searched = searchPosses(databasePosses, browseState.query)
    return browseState.realmFilter === 'ALL'
      ? searched
      : searched.filter((posse) => posse.realm === browseState.realmFilter)
  }, [browseState.query, browseState.realmFilter])
  const activeFilterChips = buildPosseActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
    setRealmFilter: browseState.setRealmFilter,
  })

  useActiveGlobalSearchCapture(controller, browseState)

  return renderSimpleArtifactBrowseLayout({
    activeEntity: 'posses',
    activeFilterChips,
    filteredCount: records.length,
    filters: (
      <PosseDatabaseFilters
        onQueryChange={browseState.setQuery}
        onRealmFilterChange={browseState.setRealmFilter}
        query={browseState.query}
        realmFilter={browseState.realmFilter}
        searchInputRef={controller.searchInputRef}
      />
    ),
    onResetFilters: browseState.resetFilters,
    results: <PosseGrid onSelectPosse={controller.openPosseDetail} posses={records} />,
    search: controller.activeSearch,
    title: 'Posses',
    totalCount: databasePosses.length,
    unitNoun: 'posses',
  })
}

export function CovenantsBrowse({controller}: EntityBrowseProps): ReactNode {
  const browseState = useCovenantDatabaseBrowseState()
  const records = useMemo(
    () => searchCovenants(databaseCovenants, browseState.query),
    [browseState.query],
  )
  const activeFilterChips = buildCovenantActiveFilterChips(browseState, {
    clearQuery: browseState.clearQuery,
  })

  useActiveGlobalSearchCapture(controller, browseState)

  return renderSimpleArtifactBrowseLayout({
    activeEntity: 'covenants',
    activeFilterChips,
    filteredCount: records.length,
    filters: (
      <CovenantDatabaseFilters
        onQueryChange={browseState.setQuery}
        query={browseState.query}
        searchInputRef={controller.searchInputRef}
      />
    ),
    onResetFilters: browseState.resetFilters,
    results: <CovenantGrid covenants={records} onSelectCovenant={controller.openCovenantDetail} />,
    search: controller.activeSearch,
    title: 'Covenants',
    totalCount: databaseCovenants.length,
    unitNoun: 'covenants',
  })
}
