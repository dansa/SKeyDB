import {getAwakenerCardAsset, getAwakenerPortraitAsset} from '@/domain/awakener-assets'
import {resolveAwakenerLiteStatsForLevel, type Awakener} from '@/domain/awakeners'
import {formatAwakenerAvailabilityLabel} from '@/domain/database-browse-state'
import {formatAwakenerNameForUi} from '@/domain/name-format'
import {getRealmAccent, getRealmBadge, getRealmIcon, getRealmLabel} from '@/domain/realms'

import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'
import {DatabaseGridCardTitle} from './DatabaseGridCardTitle'
import {DatabaseStatTriad} from './DatabaseStatTriad'

const DATABASE_GRID_AWAKENER_STAT_LEVEL = 60

interface AwakenerGridCardProps {
  awakener: Awakener
  index: number
  onSelect: (id: string) => void
}

function formatReleaseDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined
  }
  const parsedDate = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsedDate)
}

export function AwakenerGridCard({awakener, index, onSelect}: AwakenerGridCardProps) {
  const cardAsset = getAwakenerCardAsset(awakener.name)
  const portraitAsset = getAwakenerPortraitAsset(awakener.name)
  const displayName = formatAwakenerNameForUi(awakener.name)
  const realmAccent = getRealmAccent(awakener.realm)
  const realmBadge = getRealmBadge(awakener.realm)
  const realmIcon = getRealmIcon(awakener.realm)
  const realmLabel = getRealmLabel(awakener.realm)
  const stats = resolveAwakenerLiteStatsForLevel(awakener, DATABASE_GRID_AWAKENER_STAT_LEVEL)
  const prioritizeImage = shouldPrioritizeDatabaseGridImage(index)
  const detailItems = [
    formatAwakenerAvailabilityLabel(awakener.availabilityType),
    formatReleaseDate(awakener.releaseDate),
  ].filter(Boolean)

  return (
    <DatabaseGridCardFrame
      ariaLabel={`View details for ${displayName}`}
      content={{
        detail:
          detailItems.length > 0 ? (
            <>
              {detailItems.map((item, itemIndex) => (
                <span key={item}>
                  {itemIndex > 0 ? <span className='mx-1.5 text-slate-600'>|</span> : null}
                  {item}
                </span>
              ))}
            </>
          ) : null,
        dossierTitleAddon: realmIcon ? (
          <img alt='' className='h-5 w-5 object-contain' draggable={false} src={realmIcon} />
        ) : null,
        meta: stats ? <DatabaseStatTriad stats={stats} /> : null,
        title: <DatabaseGridCardTitle title={displayName}>{displayName}</DatabaseGridCardTitle>,
      }}
      media={{
        alt: displayName,
        dossierClassName: 'object-cover object-top',
        dossierSrc: portraitAsset ?? cardAsset,
        posterBadge: {label: realmLabel, src: realmBadge},
        posterClassName: 'object-cover object-top',
        posterSrc: cardAsset,
        prioritize: prioritizeImage,
      }}
      onSelect={() => {
        onSelect(awakener.id)
      }}
      realmAccent={realmAccent}
    />
  )
}
