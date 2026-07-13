import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {resolveAwakenerLiteStatsForLevel, type Awakener} from '@/domain/awakeners'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getRealmAccent, getRealmBadge, getRealmIcon, getRealmLabel} from '@/domain/realms'

import {
  DEFAULT_AWAKENER_CARD_META_CONTEXT,
  getAwakenerCardMetaData,
  type AwakenerCardMetaContext,
} from './awakener-card-meta-model'
import {AwakenerCardMeta} from './AwakenerCardMeta'
import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseGridCardFrame, type HybridDatabaseCardMode} from './DatabaseGridCardFrame'
import {DatabaseStatTriad} from './PopoverAtoms'

const DATABASE_GRID_AWAKENER_STAT_LEVEL = 60

interface AwakenerGridCardProps {
  awakener: Awakener
  cardMetaContext?: AwakenerCardMetaContext
  index: number
  onPreload?: (id: string) => void
  onSelect: (id: string) => void
  variant?: HybridDatabaseCardMode
}

export function AwakenerGridCard({
  awakener,
  cardMetaContext = DEFAULT_AWAKENER_CARD_META_CONTEXT,
  index,
  onPreload,
  onSelect,
  variant = 'poster',
}: AwakenerGridCardProps) {
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const portraitAsset = getAwakenerPortraitAsset(awakener.name)
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmAccent = getRealmAccent(awakener.realm)
  const realmBadge = getRealmBadge(awakener.realm)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const stats = resolveAwakenerLiteStatsForLevel(awakener, DATABASE_GRID_AWAKENER_STAT_LEVEL)
  const prioritizeImage = shouldPrioritizeDatabaseGridImage(index)
  const cardMeta = getAwakenerCardMetaData(awakener, cardMetaContext)
  const metaDetail = cardMeta ? <AwakenerCardMeta meta={cardMeta} /> : null

  return (
    <DatabaseGridCardFrame
      content={{
        detail: metaDetail ? {body: metaDetail, visibility: 'all'} : undefined,
        dossierTitleAddon: realmIcon ? (
          <img alt='' className='database-awakener-realm-icon' draggable={false} src={realmIcon} />
        ) : null,
        meta: stats ? <DatabaseStatTriad stats={stats} /> : null,
        title: displayName,
      }}
      media={{
        alt: displayName,
        dossierSrc: portraitAsset ?? cardAsset,
        posterBadge: {label: realmLabel, src: realmBadge},
        posterSrc: cardAsset,
        prioritize: prioritizeImage,
      }}
      onPreload={() => {
        onPreload?.(awakener.id)
      }}
      onSelect={() => {
        onSelect(awakener.id)
      }}
      realmAccent={realmAccent}
      variant={variant}
    />
  )
}
