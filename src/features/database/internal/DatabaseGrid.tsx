import type {Awakener} from '@/domain/awakeners'

import {AwakenerGridCard} from './AwakenerGridCard'
import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'

interface DatabaseGridProps {
  awakeners: Awakener[]
  onSelectAwakener: (id: string) => void
}

export function DatabaseGrid({awakeners, onSelectAwakener}: DatabaseGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No awakeners match the current filters.'
      items={awakeners}
      layout='hybrid'
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
