import type {Wheel} from '@/domain/wheels'
import {CatalogGrid} from '@/ui/cards/CatalogGrid'

import {WheelGridCard} from './WheelGridCard'

interface WheelGridProps {
  wheels: Wheel[]
  onSelectWheel: (wheelId: string) => void
}

export function WheelGrid({wheels, onSelectWheel}: WheelGridProps) {
  return (
    <CatalogGrid
      emptyMessage='No wheels match the current filters.'
      items={wheels}
      renderItem={(wheel, index) => (
        <WheelGridCard index={index} key={wheel.id} onSelect={onSelectWheel} wheel={wheel} />
      )}
    />
  )
}
