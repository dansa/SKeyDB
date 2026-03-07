import {DupeLevelDisplay} from '@/components/ui/DupeLevelDisplay'

import {CardCovenantTile} from './CardCovenantTile'
import {CardWheelTile} from './CardWheelTile'
import type {DragData, PredictedDropHover, TeamSlot} from './types'

interface CardWheelZoneProps {
  slot: TeamSlot
  interactive: boolean
  wheelKeyPrefix: string
  showOwnership?: boolean
  compactCovenant?: boolean
  activeWheelIndex?: number | null
  isCovenantActive?: boolean
  activeDragKind?: DragData['kind'] | null
  predictedDropHover?: PredictedDropHover
  onRemoveActiveWheel?: () => void
  onWheelSlotClick?: (wheelIndex: number) => void
  onCovenantSlotClick?: () => void
  awakenerLevel?: number
  awakenerOwnedLevel?: number | null
  wheelOwnedLevels?: [number | null, number | null]
  allowActiveRemoval?: boolean
}

export function CardWheelZone({
  slot,
  interactive,
  wheelKeyPrefix,
  showOwnership = true,
  compactCovenant = false,
  activeWheelIndex = null,
  isCovenantActive = false,
  activeDragKind = null,
  predictedDropHover = null,
  onRemoveActiveWheel,
  onWheelSlotClick,
  onCovenantSlotClick,
  awakenerLevel = 60,
  awakenerOwnedLevel = null,
  wheelOwnedLevels = [null, null],
  allowActiveRemoval = true,
}: CardWheelZoneProps) {
  return (
    <div
      className={`builder-card-wheel-zone pointer-events-none absolute inset-x-0 bottom-0 z-20 p-2 ${
        compactCovenant ? 'builder-card-wheel-zone-ghost' : ''
      }`}
    >
      <div className='builder-card-meta-row flex items-end gap-2 pb-2'>
        <div className='builder-card-meta-left pointer-events-none min-w-0 flex-1 pb-1'>
          {showOwnership && slot.awakenerName && awakenerOwnedLevel !== null ? (
            <p className='builder-awakener-level'>
              <span className='builder-awakener-level-prefix'>Lv.</span>
              <span className='builder-awakener-level-value'>{awakenerLevel}</span>
            </p>
          ) : null}
          {showOwnership && awakenerOwnedLevel !== null ? (
            <DupeLevelDisplay
              className='builder-awakener-dupe builder-awakener-dupe-meta builder-dupe-owned'
              level={awakenerOwnedLevel}
            />
          ) : null}
        </div>
        <div className='builder-card-covenant-wrap shrink-0 self-end'>
          <CardCovenantTile
            activeDragKind={activeDragKind}
            covenantId={slot.covenantId}
            interactive={interactive}
            isActive={isCovenantActive}
            onClick={onCovenantSlotClick}
            predictedDropHover={predictedDropHover}
            slotId={slot.slotId}
          />
        </div>
      </div>

      <div className='builder-card-wheel-grid mt-1.5 grid grid-cols-2 gap-1.5'>
        {slot.wheels.map((wheelId, index) => (
          <CardWheelTile
            activeDragKind={activeDragKind}
            interactive={interactive}
            isActive={activeWheelIndex === index}
            key={`${wheelKeyPrefix}-wheel-${String(index)}`}
            allowActiveRemoval={allowActiveRemoval}
            onClick={onWheelSlotClick}
            ownedLevel={wheelOwnedLevels[index] ?? null}
            showOwnership={showOwnership}
            onRemove={allowActiveRemoval ? onRemoveActiveWheel : undefined}
            predictedDropHover={predictedDropHover}
            slotId={slot.slotId}
            wheelId={wheelId}
            wheelIndex={index}
          />
        ))}
      </div>
    </div>
  )
}
