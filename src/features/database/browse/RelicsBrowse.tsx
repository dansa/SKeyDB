import {useMemo, type ReactNode} from 'react'

import {buildDatabaseRelicPath} from '@/domain/database-paths'
import {RELIC_DATABASE_SORT_OPTIONS} from '@/domain/relic-database-browse-state'
import {mergeRelicDisplayScopesForMatches} from '@/domain/relic-database-display-scopes'
import {buildRelicDatabaseViewResult} from '@/domain/relic-database-view'
import {createRelicDetailResultSet} from '@/features/database/detail/database-detail-result-set'
import {buildRelicActiveFilterChips} from '@/features/database/internal/database-active-filter-chips'
import {EntityViewControls} from '@/features/database/internal/EntityViewControls'
import {RelicDatabaseFilters} from '@/features/database/internal/RelicDatabaseFilters'
import {RelicGrid} from '@/features/database/internal/RelicGrid'

import {databaseAwakeners, databaseRelics} from '../data'
import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import {getRelicSortDirectionLabel, getRelicSortLabel} from './databaseBrowseSortLabels'
import {DetailModalHostSlot, type EntityBrowseProps} from './EntityBrowseShared'
import {useActiveGlobalSearchCapture, useEntityDetailActions} from './useEntityBrowseActions'
import {useRelicsDatabaseBrowseState} from './useRelicsDatabaseBrowseState'

export function RelicsBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = useRelicsDatabaseBrowseState()
  const {displayScopes, query, setDisplayScopes} = browseState
  const {openDetail, preloadDetail, warmDetailShell} = useEntityDetailActions(
    databaseRelics,
    buildDatabaseRelicPath,
    'relic',
    controller,
  )
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
          onPreloadRelic={preloadDetail}
          onSelectRelic={openDetail}
          onWarmRelicShell={warmDetailShell}
          relics={relics}
        />
      </div>
    ),
    [
      displayScopes,
      hasExplicitMatchRequest,
      openDetail,
      preloadDetail,
      warmDetailShell,
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
