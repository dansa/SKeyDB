import {DEFAULT_REALM_ACCENT, getRealmAccent} from '@/domain/realms'

import {databaseCardTitleClassName} from './database-card-typography'
import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface SimpleArtifactGridCardProps {
  id: string
  name: string
  imageSrc: string | undefined
  imageTreatment?: 'badge' | 'emblem'
  realm?: string
  index: number
  onSelect: (id: string) => void
}

export function SimpleArtifactGridCard({
  id,
  imageSrc,
  imageTreatment = 'badge',
  index,
  name,
  onSelect,
  realm = 'NEUTRAL',
}: SimpleArtifactGridCardProps) {
  const isNeutral = realm === 'NEUTRAL'
  const realmAccent = isNeutral ? DEFAULT_REALM_ACCENT : getRealmAccent(realm)
  const posterImageClassName =
    imageTreatment === 'emblem'
      ? 'database-grid-card__image--emblem object-contain object-center'
      : 'database-grid-card__image--badge object-contain object-center'

  return (
    <DatabaseGridCardFrame
      ariaLabel={`View details for ${name}`}
      content={{
        title: (
          <p
            className={`${databaseCardTitleClassName} database-grid-card__title-text`}
            title={name}
          >
            {name}
          </p>
        ),
      }}
      layout='square-art'
      media={{
        alt: name,
        posterAspectClassName: 'aspect-square',
        posterClassName: posterImageClassName,
        posterSrc: imageSrc,
        prioritize: index < PRIORITIZED_GRID_IMAGE_COUNT,
      }}
      onSelect={() => {
        onSelect(id)
      }}
      realmAccent={realmAccent}
    />
  )
}
