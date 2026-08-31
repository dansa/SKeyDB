import {getOrisonAssetByAssetId} from '@/domain/orison-assets'
import type {Orison} from '@/domain/orisons'

import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseCatalogGrid} from './DatabaseCatalogGrid'
import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'

export function OrisonGrid({
  orisons,
  onSelectOrison,
  onPreloadOrison,
  onWarmOrisonShell,
}: {
  orisons: Orison[]
  onSelectOrison: (id: string) => void
  onPreloadOrison?: (id: string) => void
  onWarmOrisonShell?: () => void
}) {
  return (
    <DatabaseCatalogGrid
      emptyMessage='No orisons match the current filters.'
      gridLayout='square-art'
      items={orisons}
      renderItem={(orison, index) => (
        <DatabaseGridCardFrame
          actionLabel='View orison details for'
          content={{
            corner:
              orison.variantCount > 1 ? (
                <span
                  aria-label={`${orison.variantCount.toString()} variants`}
                  className='database-relic-card__variant-count'
                >
                  ×{orison.variantCount}
                </span>
              ) : null,
            meta: (
              <>
                {orison.orisonType === 'STANDARD' ? 'Standard' : 'Special'} ·{' '}
                {orison.variantTiers.join(' / ')}
              </>
            ),
            title: orison.name,
          }}
          key={orison.id}
          media={{
            alt: orison.name,
            posterSrc: getOrisonAssetByAssetId(orison.assetId),
            posterTreatment: 'badge',
            prioritize: shouldPrioritizeDatabaseGridImage(index),
          }}
          onPreload={() => onPreloadOrison?.(orison.id)}
          onSelect={() => {
            onSelectOrison(orison.id)
          }}
          onWarmShell={onWarmOrisonShell}
          realmAccent='#d6b36a'
          variant='square-art'
        />
      )}
    />
  )
}
