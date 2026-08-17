import {getMainstatIcon} from '@/domain/mainstats'
import {getRealmAccent} from '@/domain/realms'
import {getWheelAssetById} from '@/domain/wheel-assets'
import {getWheelMainstatLabel, type Wheel} from '@/domain/wheels'

import {shouldPrioritizeDatabaseGridImage} from './database-grid-card-priority'
import {DatabaseGridCardFrame, type HybridDatabaseCardMode} from './DatabaseGridCardFrame'

interface WheelGridCardProps {
  wheel: Wheel
  index: number
  onPreload?: (wheelId: string) => void
  onSelect: (wheelId: string) => void
  onWarmShell?: () => void
  variant?: HybridDatabaseCardMode
}

function WheelMainstatRow({icon, label}: {icon: string | undefined; label: string}) {
  return (
    <div className='database-wheel-mainstat-row'>
      {icon ? <img alt='' className='database-wheel-mainstat-row__icon' src={icon} /> : null}
      <span className='database-wheel-mainstat-row__label'>{label}</span>
    </div>
  )
}

function WheelOwnerDetail({ownerName}: {ownerName: string}) {
  return (
    <span className='database-wheel-owner-detail'>
      <span className='database-wheel-owner-detail__label'>Owner:</span>{' '}
      <span className='database-wheel-owner-detail__value'>{ownerName}</span>
    </span>
  )
}

export function WheelGridCard({
  wheel,
  index,
  onPreload,
  onSelect,
  onWarmShell,
  variant = 'poster',
}: WheelGridCardProps) {
  const asset = getWheelAssetById(wheel.id)
  const realmAccent = getRealmAccent(wheel.realm)
  const mainstatIcon = getMainstatIcon(wheel.mainstatKey)
  const mainstatLabel = getWheelMainstatLabel(wheel)
  const prioritizeImage = shouldPrioritizeDatabaseGridImage(index)
  const ownerDetail = wheel.ownerAwakenerName ? (
    <WheelOwnerDetail ownerName={wheel.ownerAwakenerName} />
  ) : null
  const mainstatDetail = mainstatLabel ? (
    <WheelMainstatRow icon={mainstatIcon} label={mainstatLabel} />
  ) : null

  return (
    <DatabaseGridCardFrame
      content={{
        detail: ownerDetail ? {body: ownerDetail, visibility: 'dossier'} : undefined,
        meta: mainstatDetail,
        title: wheel.name,
      }}
      media={{
        alt: wheel.name,
        dossierTreatment: 'wheel',
        dossierSrc: asset,
        posterSrc: asset,
        posterTreatment: 'wheel',
        prioritize: prioritizeImage,
      }}
      onPreload={() => {
        onPreload?.(wheel.id)
      }}
      onSelect={() => {
        onSelect(wheel.id)
      }}
      onWarmShell={onWarmShell}
      realmAccent={realmAccent}
      variant={variant}
    />
  )
}
