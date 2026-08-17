import {useMemo, type ReactNode} from 'react'

import {DATABASE_SORT_OPTIONS} from '@/domain/database-browse-state'
import {buildDatabaseAwakenerPath} from '@/domain/database-paths'
import {createAwakenerDetailResultSet} from '@/features/database/detail/database-detail-result-set'
import {buildAwakenerActiveFilterChips} from '@/features/database/internal/database-active-filter-chips'
import {DatabaseFilters} from '@/features/database/internal/DatabaseFilters'
import {DatabaseGrid} from '@/features/database/internal/DatabaseGrid'
import {EntityViewControls} from '@/features/database/internal/EntityViewControls'
import {useDatabaseViewModel} from '@/features/database/internal/useDatabaseViewModel'

import {databaseAwakeners} from '../data'
import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import {getDatabaseSortDirectionLabel, getDatabaseSortLabel} from './databaseBrowseSortLabels'
import {DetailModalHostSlot, type EntityBrowseProps} from './EntityBrowseShared'
import {useDatabaseBrowseState} from './useDatabaseBrowseState'
import {useActiveGlobalSearchCapture, useEntityDetailActions} from './useEntityBrowseActions'

export function AwakenersBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useDatabaseBrowseState()
  const viewModel = useDatabaseViewModel(databaseAwakeners, browseState)
  const {openDetail, preloadDetail, warmDetailShell} = useEntityDetailActions(
    databaseAwakeners,
    buildDatabaseAwakenerPath,
    'awakener',
    controller,
  )
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
        onPreloadAwakener={preloadDetail}
        onSelectAwakener={openDetail}
        onWarmAwakenerShell={warmDetailShell}
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
      openDetail,
      preloadDetail,
      warmDetailShell,
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
