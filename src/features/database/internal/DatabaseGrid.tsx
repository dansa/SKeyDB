import type {Awakener} from '@/domain/awakeners'
import type {
  AvailabilityFilterId,
  AwakenerScalingSubstatFilter,
  DatabaseSortKey,
  RarityFilterId,
} from '@/domain/database-browse-state'

import type {AwakenerCardMetaContext} from './awakener-card-meta-model'
import {AwakenerGridCard} from './AwakenerGridCard'
import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'

interface DatabaseGridProps {
  availabilityFilter: AvailabilityFilterId
  awakeners: Awakener[]
  onPreloadAwakener?: (id: string) => void
  onSelectAwakener: (id: string) => void
  rarityFilter: RarityFilterId
  scalingSubstatFilters?: readonly AwakenerScalingSubstatFilter[]
  sortKey: DatabaseSortKey
}

const EMPTY_SCALING_SUBSTAT_FILTERS: readonly AwakenerScalingSubstatFilter[] = []

export function DatabaseGrid({
  availabilityFilter,
  awakeners,
  onPreloadAwakener,
  onSelectAwakener,
  rarityFilter,
  scalingSubstatFilters = EMPTY_SCALING_SUBSTAT_FILTERS,
  sortKey,
}: DatabaseGridProps) {
  const cardMetaContext: AwakenerCardMetaContext = {
    availabilityFilter,
    rarityFilter,
    scalingSubstatFilters,
    sortKey,
  }

  return (
    <DatabaseCatalogGrid
      emptyMessage='No awakeners match the current filters.'
      gridLayout='hybrid'
      items={awakeners}
      renderItem={(awakener, index, variant) => (
        <AwakenerGridCard
          awakener={awakener}
          cardMetaContext={cardMetaContext}
          index={index}
          key={awakener.id}
          onPreload={onPreloadAwakener}
          onSelect={onSelectAwakener}
          variant={variant}
        />
      )}
    />
  )
}
