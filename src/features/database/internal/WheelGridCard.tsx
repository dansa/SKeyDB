import {getMainstatIcon} from '@/domain/mainstats'
import {getRealmAccent} from '@/domain/realms'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheelMainstatLabel, type Wheel} from '@/domain/wheels'

import {databaseCardTitleClassName} from './database-card-typography'
import {DatabaseGridCardFrame} from './DatabaseGridCardFrame'

const PRIORITIZED_GRID_IMAGE_COUNT = 24

interface WheelGridCardProps {
  wheel: Wheel
  index: number
  onSelect: (wheelId: string) => void
}

function WheelMainstatRow({icon, label}: {icon: string | undefined; label: string}) {
  if (!label) {
    return null
  }
  return (
    <div className='flex min-w-0 items-center gap-1.5 text-[11px] leading-[1.25] text-slate-300'>
      {icon ? <img alt='' className='h-3 w-3 object-contain opacity-90' src={icon} /> : null}
      <span className='truncate'>{label}</span>
    </div>
  )
}

export function WheelGridCard({wheel, index, onSelect}: WheelGridCardProps) {
  const asset = getWheelAssetById(wheel.id)
  const realmAccent = getRealmAccent(wheel.realm)
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const mainstatLabel = getWheelMainstatLabel(wheel)
  const prioritizeImage = index < PRIORITIZED_GRID_IMAGE_COUNT

  return (
    <DatabaseGridCardFrame
      ariaLabel={`View details for ${wheel.name}`}
      content={{
        detail: wheel.ownerAwakenerName ? (
          <>
            <span className='text-slate-500'>Owner:</span>{' '}
            <span className='text-slate-300'>{wheel.ownerAwakenerName}</span>
          </>
        ) : null,
        meta: <WheelMainstatRow icon={mainstatIcon} label={mainstatLabel} />,
        title: (
          <p
            className={`${databaseCardTitleClassName} database-grid-card__title-text`}
            title={wheel.name}
          >
            {wheel.name}
          </p>
        ),
      }}
      media={{
        alt: wheel.name,
        dossierClassName: '[transform:scale(1.15)] object-cover object-center',
        dossierSrc: asset,
        posterClassName: '[transform:scale(1.15)] object-cover object-center',
        posterSrc: asset,
        prioritize: prioritizeImage,
      }}
      onSelect={() => {
        onSelect(wheel.id)
      }}
      realmAccent={realmAccent}
    />
  )
}
