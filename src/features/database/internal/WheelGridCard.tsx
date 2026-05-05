import {getMainstatIcon} from '@/domain/mainstats'
import {getRealmAccent} from '@/domain/realms'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'
import {
  databaseCardTitleClampStyle,
  databaseCardTitleClassName,
} from '@/ui/cards/database-card-typography'
import {DatabaseGridCardFrame} from '@/ui/cards/DatabaseGridCardFrame'

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface WheelGridCardProps {
  wheel: Wheel
  index: number
  onSelect: (wheelId: string) => void
}

export function WheelGridCard({wheel, index, onSelect}: WheelGridCardProps) {
  const asset = getWheelAssetById(wheel.id)
  const realmAccent = getRealmAccent(wheel.realm)
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const prioritizeImage = index < PRIORITIZED_GRID_IMAGE_COUNT

  return (
    <DatabaseGridCardFrame
      ariaLabel={`View details for ${wheel.name}`}
      cornerOverlay={
        mainstatIcon ? (
          <div className='pointer-events-none absolute top-2 right-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200/20 bg-slate-950/40 shadow-[0_2px_8px_rgba(2,6,23,0.24)] backdrop-blur-[1px]'>
            <img
              alt=''
              className='h-4 w-4 object-contain opacity-90'
              draggable={false}
              src={mainstatIcon}
            />
          </div>
        ) : null
      }
      fadeHeightClass='h-[46%]'
      imageAlt={wheel.name}
      imageSrc={asset}
      onSelect={() => {
        onSelect(wheel.id)
      }}
      prioritizeImage={prioritizeImage}
      realmAccent={realmAccent}
    >
      <p className={databaseCardTitleClassName} style={databaseCardTitleClampStyle}>
        {wheel.name}
      </p>
    </DatabaseGridCardFrame>
  )
}
