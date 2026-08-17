import {DEFAULT_REALM_ACCENT, getRealmAccent} from '@/domain/realms'

import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseGridCardFrame, type DatabaseGridCardImageTreatment} from './DatabaseGridCardFrame'

interface SimpleArtifactGridCardProps {
  id: string
  name: string
  imageSrc: string | undefined
  imageTreatment?: Extract<DatabaseGridCardImageTreatment, 'badge' | 'emblem'>
  realm?: string
  index: number
  onPreload?: (id: string) => void
  onSelect: (id: string) => void
  onWarmShell?: () => void
}

export function SimpleArtifactGridCard({
  id,
  imageSrc,
  imageTreatment = 'badge',
  index,
  name,
  onPreload,
  onSelect,
  onWarmShell,
  realm = 'NEUTRAL',
}: SimpleArtifactGridCardProps) {
  const isNeutral = realm === 'NEUTRAL'
  const realmAccent = isNeutral ? DEFAULT_REALM_ACCENT : getRealmAccent(realm)

  return (
    <DatabaseGridCardFrame
      content={{
        title: name,
      }}
      media={{
        alt: name,
        posterSrc: imageSrc,
        posterTreatment: imageTreatment,
        prioritize: shouldPrioritizeDatabaseGridImage(index),
      }}
      onPreload={() => {
        onPreload?.(id)
      }}
      onSelect={() => {
        onSelect(id)
      }}
      onWarmShell={onWarmShell}
      realmAccent={realmAccent}
      variant='square-art'
    />
  )
}
