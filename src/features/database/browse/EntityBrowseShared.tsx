import type {ComponentType, ReactNode} from 'react'

import type {DatabaseEntityId} from '@/domain/database-entity-paths'
import type {DatabaseDetailResultSet} from '@/features/database/detail/database-detail-result-navigation'
import type {ActiveFilterChip} from '@/ui/filters/ActiveFilterChips'

import {DatabaseBrowseLayout} from '../DatabaseBrowseLayout'
import type {EntityBrowseController} from './useEntityBrowseController'

export interface EntityBrowseProps {
  controller: EntityBrowseController
  DetailModalHost?: ComponentType<{resultSet: DatabaseDetailResultSet}>
  renderDetailModalHost?: (resultSet: DatabaseDetailResultSet) => ReactNode
}

interface SimpleArtifactBrowseLayoutOptions {
  activeEntity: Extract<DatabaseEntityId, 'posses' | 'covenants' | 'orisons'>
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

export function SimpleArtifactBrowseLayout({
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

export function DetailModalHostSlot({
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
