import {useMemo, type ReactNode} from 'react'

import {buildDatabaseOrisonPath} from '@/domain/database-paths'
import {searchOrisons} from '@/domain/orisons-search'
import {createOrisonDetailResultSet} from '@/features/database/detail/database-detail-result-set'
import {OrisonDatabaseFilters} from '@/features/database/internal/OrisonDatabaseFilters'
import {OrisonGrid} from '@/features/database/internal/OrisonGrid'

import {databaseOrisons} from '../data'
import {
  DetailModalHostSlot,
  type EntityBrowseProps,
  SimpleArtifactBrowseLayout,
} from './EntityBrowseShared'
import {useActiveGlobalSearchCapture, useEntityDetailActions} from './useEntityBrowseActions'
import {useOrisonsDatabaseBrowseState} from './useOrisonsDatabaseBrowseState'

export function OrisonsBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const state = useOrisonsDatabaseBrowseState()
  const {openDetail, preloadDetail, warmDetailShell} = useEntityDetailActions(
    databaseOrisons,
    buildDatabaseOrisonPath,
    'orison',
    controller,
  )
  const records = useMemo(
    () =>
      searchOrisons(databaseOrisons, state.query).filter(
        (orison) =>
          (state.typeFilter === 'ALL' || orison.orisonType === state.typeFilter) &&
          (state.tierFilter === 'ALL' || orison.variantTiers.includes(state.tierFilter)),
      ),
    [state.query, state.tierFilter, state.typeFilter],
  )
  const chips = [
    ...(state.query
      ? [{key: 'query', label: `Search: ${state.query}`, onClear: state.clearQuery}]
      : []),
    ...(state.typeFilter !== 'ALL'
      ? [
          {
            key: 'type',
            label: `Type: ${state.typeFilter === 'STANDARD' ? 'Standard' : 'Special'}`,
            onClear: () => {
              state.setTypeFilter('ALL')
            },
          },
        ]
      : []),
    ...(state.tierFilter !== 'ALL'
      ? [
          {
            key: 'tier',
            label: `Tier: ${state.tierFilter}`,
            onClear: () => {
              state.setTierFilter('ALL')
            },
          },
        ]
      : []),
  ]
  const resultSet = useMemo(() => createOrisonDetailResultSet(records), [records])
  useActiveGlobalSearchCapture(controller, state)
  return (
    <>
      <SimpleArtifactBrowseLayout
        activeEntity='orisons'
        activeFilterChips={chips}
        filteredCount={records.length}
        filters={
          <OrisonDatabaseFilters
            query={state.query}
            typeFilter={state.typeFilter}
            tierFilter={state.tierFilter}
            searchInputRef={controller.searchInputRef}
            onQueryChange={state.setQuery}
            onTypeFilterChange={state.setTypeFilter}
            onTierFilterChange={state.setTierFilter}
          />
        }
        onResetFilters={state.resetFilters}
        results={
          <OrisonGrid
            orisons={records}
            onSelectOrison={openDetail}
            onPreloadOrison={preloadDetail}
            onWarmOrisonShell={warmDetailShell}
          />
        }
        search={controller.activeSearch}
        title='Orisons'
        totalCount={databaseOrisons.length}
        unitNoun='orisons'
      />
      <DetailModalHostSlot
        DetailModalHost={DetailModalHost}
        renderDetailModalHost={renderDetailModalHost}
        resultSet={resultSet}
      />
    </>
  )
}
