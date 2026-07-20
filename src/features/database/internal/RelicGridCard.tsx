import type {Awakener} from '@/domain/awakeners'
import {getRelicAssetByAssetId} from '@/domain/relic-assets'
import type {Relic} from '@/domain/relics'

import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'
import {formatRelicCardMeta, getRelicCardAccent} from './relic-database-presentation'

interface RelicGridCardProps {
  awakeners: readonly Awakener[]
  index: number
  onPreload?: (id: string) => void
  onSelect: (id: string) => void
  relic: Relic
}

export function RelicGridCard({awakeners, index, onPreload, onSelect, relic}: RelicGridCardProps) {
  return (
    <DatabaseGridCardFrame
      actionLabel='View relic details for'
      content={{
        corner:
          relic.variantCount > 1 ? (
            <span
              aria-label={`${relic.variantCount.toString()} variants`}
              className='database-relic-card__variant-count'
            >
              ×{relic.variantCount.toString()}
            </span>
          ) : null,
        meta: formatRelicCardMeta(relic),
        title: relic.name,
      }}
      media={{
        alt: relic.name,
        posterSrc: getRelicAssetByAssetId(relic.assetId),
        posterTreatment: 'badge',
        prioritize: shouldPrioritizeDatabaseGridImage(index),
      }}
      onPreload={() => {
        onPreload?.(relic.id)
      }}
      onSelect={() => {
        onSelect(relic.id)
      }}
      realmAccent={getRelicCardAccent(relic, awakeners)}
      variant='square-art'
    />
  )
}
