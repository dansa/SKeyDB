import type {ReactNode} from 'react'

import {DATABASE_SORT_OPTIONS, type DatabaseSortKey} from '@/domain/database-browse-state'
import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import {
  WHEELS_DATABASE_SORT_OPTIONS,
  type WheelsDatabaseSortKey,
} from '@/domain/wheels-database-browse-state'
import {DatabaseFilters} from '@/features/database/internal/DatabaseFilters'
import {DatabaseGrid} from '@/features/database/internal/DatabaseGrid'
import {EntityViewControls} from '@/features/database/internal/EntityViewControls'
import {
  CovenantDatabaseFilters,
  PosseDatabaseFilters,
} from '@/features/database/internal/SimpleArtifactFilters'
import {CovenantGrid, PosseGrid} from '@/features/database/internal/SimpleArtifactGrid'
import {WheelDatabaseFilters} from '@/features/database/internal/WheelDatabaseFilters'
import {WheelGrid} from '@/features/database/internal/WheelGrid'

import {databaseCovenants, databasePosses} from '../data'
import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import type {EntityBrowseController} from './useEntityBrowseController'

function getDatabaseSortLabel(sortKey: DatabaseSortKey): string {
  if (sortKey === 'RARITY') {
    return 'Rarity'
  }
  if (sortKey === 'RELEASE_DATE') {
    return 'Release date'
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
  if (sortKey === 'RELEASE_DATE') {
    return direction === 'ASC' ? 'Old -> New' : 'New -> Old'
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

interface EntityBrowseRegistryEntry {
  allowedUrlParams: readonly string[]
  render: (controller: EntityBrowseController) => ReactNode
  title: string
  unitNoun: string
}

interface SimpleArtifactBrowseLayoutOptions {
  activeEntity: Extract<DatabaseEntityId, 'posses' | 'covenants'>
  activeFilterChips: EntityBrowseController['posses']['activeFilterChips']
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

function renderAwakenersBrowse(controller: EntityBrowseController): ReactNode {
  const browseState = controller.awakeners.state
  const viewModel = controller.awakeners.viewModel
  return (
    <DatabaseBrowseLayout
      activeEntity='awakeners'
      activeFilterChips={controller.awakeners.activeFilterChips}
      filteredCount={viewModel.awakeners.length}
      filters={
        <DatabaseFilters
          onQueryChange={browseState.setQuery}
          onAvailabilityFilterChange={browseState.setAvailabilityFilter}
          onRarityFilterChange={browseState.setRarityFilter}
          onRealmFilterChange={browseState.setRealmFilter}
          onTypeFilterChange={browseState.setTypeFilter}
          query={browseState.query}
          availabilityFilter={browseState.availabilityFilter}
          rarityFilter={browseState.rarityFilter}
          realmFilter={browseState.realmFilter}
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

function renderWheelsBrowse(controller: EntityBrowseController): ReactNode {
  const browseState = controller.wheels.state
  const viewModel = controller.wheels.viewModel
  return (
    <DatabaseBrowseLayout
      activeEntity='wheels'
      activeFilterChips={controller.wheels.activeFilterChips}
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

function renderPossesBrowse(controller: EntityBrowseController): ReactNode {
  const browseState = controller.posses.state
  return renderSimpleArtifactBrowseLayout({
    activeEntity: 'posses',
    activeFilterChips: controller.posses.activeFilterChips,
    filteredCount: controller.posses.records.length,
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
    results: (
      <PosseGrid onSelectPosse={controller.openPosseDetail} posses={controller.posses.records} />
    ),
    search: controller.activeSearch,
    title: 'Posses',
    totalCount: databasePosses.length,
    unitNoun: 'posses',
  })
}

function renderCovenantsBrowse(controller: EntityBrowseController): ReactNode {
  const browseState = controller.covenants.state
  return renderSimpleArtifactBrowseLayout({
    activeEntity: 'covenants',
    activeFilterChips: controller.covenants.activeFilterChips,
    filteredCount: controller.covenants.records.length,
    filters: (
      <CovenantDatabaseFilters
        onQueryChange={browseState.setQuery}
        query={browseState.query}
        searchInputRef={controller.searchInputRef}
      />
    ),
    onResetFilters: browseState.resetFilters,
    results: (
      <CovenantGrid
        covenants={controller.covenants.records}
        onSelectCovenant={controller.openCovenantDetail}
      />
    ),
    search: controller.activeSearch,
    title: 'Covenants',
    totalCount: databaseCovenants.length,
    unitNoun: 'covenants',
  })
}

export const entityBrowseRegistry: Record<DatabaseEntityId, EntityBrowseRegistryEntry> = {
  awakeners: {
    allowedUrlParams: ['q', 'realm', 'rarity', 'type', 'availability', 'sort', 'dir', 'group'],
    title: 'Awakeners',
    unitNoun: 'awakeners',
    render: renderAwakenersBrowse,
  },
  wheels: {
    allowedUrlParams: ['q', 'realm', 'rarity', 'mainstat', 'sort', 'dir'],
    title: 'Wheels',
    unitNoun: 'wheels',
    render: renderWheelsBrowse,
  },
  posses: {
    allowedUrlParams: ['q', 'realm'],
    title: 'Posses',
    unitNoun: 'posses',
    render: renderPossesBrowse,
  },
  covenants: {
    allowedUrlParams: ['q'],
    title: 'Covenants',
    unitNoun: 'covenants',
    render: renderCovenantsBrowse,
  },
}

export function renderEntityBrowse(controller: EntityBrowseController): ReactNode {
  return entityBrowseRegistry[controller.activeEntity].render(controller)
}
