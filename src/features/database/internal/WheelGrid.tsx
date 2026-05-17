import type {Wheel} from '@/domain/wheels'

import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {WheelGridCard} from './WheelGridCard'

interface WheelGridProps {
  wheels: Wheel[]
  onSelectWheel: (wheelId: string) => void
}

export function WheelGrid({wheels, onSelectWheel}: WheelGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No wheels match the current filters.'
      items={wheels}
      layout='hybrid'
      renderItem={(wheel, index) => (
        <WheelGridCard index={index} key={wheel.id} onSelect={onSelectWheel} wheel={wheel} />
      )}
    />
  )
}
