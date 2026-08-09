import {useMemo, type ReactNode} from 'react'

import {buildDatabasePossePath} from '@/domain/database-paths'
import {isPrimordialMemoryPosse} from '@/domain/posses'
import {searchPosses} from '@/domain/posses-search'
import {createPosseDetailResultSet} from '@/features/database/detail/database-detail-result-set'
import {buildPosseActiveFilterChips} from '@/features/database/internal/database-active-filter-chips'
import {PosseDatabaseFilters} from '@/features/database/internal/SimpleArtifactFilters'
import {PosseGrid} from '@/features/database/internal/SimpleArtifactGrid'

import {databasePosses} from '../data'
import {
  DetailModalHostSlot,
  type EntityBrowseProps,
  SimpleArtifactBrowseLayout,
} from './EntityBrowseShared'
import {useActiveGlobalSearchCapture, useEntityDetailActions} from './useEntityBrowseActions'
import {usePosseDatabaseBrowseState} from './useSimpleArtifactDatabaseBrowseState'

export function PossesBrowse({
  controller,
  DetailModalHost,
  renderDetailModalHost,
}: EntityBrowseProps): ReactNode {
  const browseState = usePosseDatabaseBrowseState()
  const {openDetail, preloadDetail, warmDetailShell} = useEntityDetailActions(
    databasePosses,
    buildDatabasePossePath,
    'posse',
    controller,
  )
  const records = useMemo(() => {
    const searched = searchPosses(databasePosses, browseState.query)
    const byType = searched.filter((posse) => {
      if (browseState.typeFilter === 'ALL') return true
      return browseState.typeFilter === 'PRIMORDIAL_MEMORY'
        ? isPrimordialMemoryPosse(posse)
        : !isPrimordialMemoryPosse(posse)
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
        onPreloadPosse={preloadDetail}
        onSelectPosse={openDetail}
        onWarmPosseShell={warmDetailShell}
        posses={records}
      />
    ),
    [openDetail, preloadDetail, records, warmDetailShell],
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
