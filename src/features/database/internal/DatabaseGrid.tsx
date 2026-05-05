import type {Awakener} from '@/domain/awakeners'
import {CatalogGrid} from '@/ui/cards/CatalogGrid'

import {AwakenerGridCard} from './AwakenerGridCard'

interface DatabaseGridProps {
  awakeners: Awakener[]
  onSelectAwakener: (id: string) => void
}

export function DatabaseGrid({awakeners, onSelectAwakener}: DatabaseGridProps) {
  return (
    <CatalogGrid
      emptyMessage='No awakeners match the current filters.'
      items={awakeners}
      renderItem={(awakener, index) => (
        <AwakenerGridCard
          awakener={awakener}
          index={index}
          key={awakener.id}
          onSelect={onSelectAwakener}
        />
      )}
    />
  )
}
