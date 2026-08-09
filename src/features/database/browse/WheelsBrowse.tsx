import {useMemo, type ReactNode} from 'react'

import {buildDatabaseWheelPath} from '@/domain/database-paths'
import {WHEELS_DATABASE_SORT_OPTIONS} from '@/domain/wheels-database-browse-state'
import {createWheelDetailResultSet} from '@/features/database/detail/database-detail-result-set'
import {buildWheelActiveFilterChips} from '@/features/database/internal/database-active-filter-chips'
import {EntityViewControls} from '@/features/database/internal/EntityViewControls'
import {useWheelsDatabaseViewModel} from '@/features/database/internal/useWheelsDatabaseViewModel'
import {WheelDatabaseFilters} from '@/features/database/internal/WheelDatabaseFilters'
import {WheelGrid} from '@/features/database/internal/WheelGrid'

import {databaseWheels} from '../data'
import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import {getWheelSortDirectionLabel, getWheelSortLabel} from './databaseBrowseSortLabels'
import {DetailModalHostSlot, type EntityBrowseProps} from './EntityBrowseShared'
import {useActiveGlobalSearchCapture, useEntityDetailActions} from './useEntityBrowseActions'
import {useWheelsDatabaseBrowseState} from './useWheelsDatabaseBrowseState'

export function WheelsBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useWheelsDatabaseBrowseState()
  const viewModel = useWheelsDatabaseViewModel(databaseWheels, browseState)
  const {openDetail, preloadDetail, warmDetailShell} = useEntityDetailActions(
    databaseWheels,
    buildDatabaseWheelPath,
    'wheel',
    controller,
  )
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
        onPreloadWheel={preloadDetail}
        onSelectWheel={openDetail}
        onWarmWheelShell={warmDetailShell}
        wheels={viewModel.wheels}
      />
    ),
    [openDetail, preloadDetail, viewModel.wheels, warmDetailShell],
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
