import type {Wheel} from '@/domain/wheels'

import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {WheelGridCard} from './WheelGridCard'

interface WheelGridProps {
  wheels: Wheel[]
  onPreloadWheel?: (wheelId: string) => void
  onSelectWheel: (wheelId: string) => void
  onWarmWheelShell?: () => void
}

export function WheelGrid({
  wheels,
  onPreloadWheel,
  onSelectWheel,
  onWarmWheelShell,
}: WheelGridProps) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No wheels match the current filters.'
      gridLayout='hybrid'
      items={wheels}
      renderItem={(wheel, index, variant) => (
        <WheelGridCard
          index={index}
          key={wheel.id}
          onPreload={onPreloadWheel}
          onSelect={onSelectWheel}
          onWarmShell={onWarmWheelShell}
          variant={variant}
          wheel={wheel}
        />
      )}
    />
  )
}
