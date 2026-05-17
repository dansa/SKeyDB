import {DEFAULT_REALM_ACCENT, getRealmAccent} from '@/domain/realms'

import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'
import {DatabaseGridCardTitle} from './DatabaseGridCardTitle'

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
      content={{
        title: <DatabaseGridCardTitle title={name}>{name}</DatabaseGridCardTitle>,
      }}
      layout='square-art'
      media={{
        alt: name,
        posterAspectClassName: 'aspect-square',
        posterClassName: posterImageClassName,
        posterSrc: imageSrc,
        prioritize: shouldPrioritizeDatabaseGridImage(index),
      }}
      onSelect={() => {
        onSelect(id)
      }}
      realmAccent={realmAccent}
    />
  )
}
