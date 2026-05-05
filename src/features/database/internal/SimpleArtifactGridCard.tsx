import {DEFAULT_REALM_ACCENT, getRealmAccent} from '@/domain/realms'
import {
  databaseCardTitleClampStyle,
  databaseCardTitleClassName,
} from '@/ui/cards/database-card-typography'
import {DatabaseGridCardFrame} from '@/ui/cards/DatabaseGridCardFrame'

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface SimpleArtifactGridCardProps {
  id: string
  name: string
  imageSrc: string | undefined
  realm?: string
  index: number
  onSelect: (id: string) => void
}

export function SimpleArtifactGridCard({
  id,
  imageSrc,
  index,
  name,
  onSelect,
  realm = 'NEUTRAL',
}: SimpleArtifactGridCardProps) {
  return (
    <DatabaseGridCardFrame
      ariaLabel={`View details for ${name}`}
      aspectClassName='aspect-[4/5]'
      fadeHeightClass='h-[44%]'
      imageAlt={name}
      imageObjectClassName='object-contain px-3 pt-2 pb-8'
      imageSrc={imageSrc}
      onSelect={() => {
        onSelect(id)
      }}
      prioritizeImage={index < PRIORITIZED_GRID_IMAGE_COUNT}
      realmAccent={realm === 'NEUTRAL' ? DEFAULT_REALM_ACCENT : getRealmAccent(realm)}
    >
      <p className={databaseCardTitleClassName} style={databaseCardTitleClampStyle}>
        {name}
      </p>
    </DatabaseGridCardFrame>
  )
}
