import type {Awakener} from '@/domain/awakeners'
import type {Relic} from '@/domain/relics'

import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {RelicGridCard} from './RelicGridCard'

export function RelicGrid({
  awakeners,
  onPreloadRelic,
  onSelectRelic,
  onWarmRelicShell,
  relics,
}: {
  awakeners: readonly Awakener[]
  onPreloadRelic?: (id: string) => void
  onSelectRelic: (id: string) => void
  onWarmRelicShell?: () => void
  relics: Relic[]
}) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No relics match the current filters.'
      gridLayout='square-art'
      items={relics}
      renderItem={(relic, index) => (
        <RelicGridCard
          awakeners={awakeners}
          index={index}
          key={relic.id}
          onPreload={onPreloadRelic}
          onSelect={onSelectRelic}
          onWarmShell={onWarmRelicShell}
          relic={relic}
        />
      )}
    />
  )
}
