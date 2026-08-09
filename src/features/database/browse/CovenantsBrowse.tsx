import {useMemo, type ReactNode} from 'react'

import {searchCovenants} from '@/domain/covenants-search'
import {buildDatabaseCovenantPath} from '@/domain/database-paths'
import {createCovenantDetailResultSet} from '@/features/database/detail/database-detail-result-set'
import {buildCovenantActiveFilterChips} from '@/features/database/internal/database-active-filter-chips'
import {CovenantDatabaseFilters} from '@/features/database/internal/SimpleArtifactFilters'
import {CovenantGrid} from '@/features/database/internal/SimpleArtifactGrid'

import {databaseCovenants} from '../data'
import {
  DetailModalHostSlot,
  type EntityBrowseProps,
  SimpleArtifactBrowseLayout,
} from './EntityBrowseShared'
import {useActiveGlobalSearchCapture, useEntityDetailActions} from './useEntityBrowseActions'
import {useCovenantDatabaseBrowseState} from './useSimpleArtifactDatabaseBrowseState'

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
  const {openDetail, preloadDetail, warmDetailShell} = useEntityDetailActions(
    databaseCovenants,
    buildDatabaseCovenantPath,
    'covenant',
    controller,
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
        onPreloadCovenant={preloadDetail}
        onSelectCovenant={openDetail}
        onWarmCovenantShell={warmDetailShell}
      />
    ),
    [openDetail, preloadDetail, records, warmDetailShell],
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
