import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'

import {PickerWheelTile} from './PickerWheelTile'
import type {WheelUsageLocation} from './types'
import {toOrdinal} from './utils'

function getWheelBlockedText(
  usedByTeam: WheelUsageLocation | undefined,
  effectiveActiveTeamId: string,
): string | null {
  if (!usedByTeam) {
    return null
  }

  if (usedByTeam.teamId !== effectiveActiveTeamId) {
    return `Used in ${toOrdinal(usedByTeam.teamOrder + 1)} team`
  }

  return 'Already used'
}

interface WheelPickerGridProps {
  filteredWheels: Wheel[]
  allowDupes: boolean
  effectiveActiveTeamId: string
  ownedWheelLevelById: Map<string, number | null>
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  onSetActiveWheel: (wheelId?: string) => void
}

export function WheelPickerGrid({
  filteredWheels,
  allowDupes,
  effectiveActiveTeamId,
  ownedWheelLevelById,
  usedWheelByTeamOrder,
  onSetActiveWheel,
}: WheelPickerGridProps) {
  return (
    <div className='grid grid-cols-4 gap-2'>
      <PickerWheelTile
        isNotSet
        onClick={() => {
          onSetActiveWheel(undefined)
        }}
      />

      {filteredWheels.map((wheel) => {
        const wheelAsset = getWheelAssetById(wheel.id)
        const usedByTeam = allowDupes ? undefined : usedWheelByTeamOrder.get(wheel.id)
        const isUsedByOtherTeam = usedByTeam && usedByTeam.teamId !== effectiveActiveTeamId
        const blockedText = getWheelBlockedText(usedByTeam, effectiveActiveTeamId)

        return (
          <PickerWheelTile
            blockedText={blockedText}
            isBlocked={Boolean(isUsedByOtherTeam)}
            isInUse={Boolean(usedByTeam)}
            isOwned={(ownedWheelLevelById.get(wheel.id) ?? null) !== null}
            key={wheel.id}
            onClick={() => {
              onSetActiveWheel(wheel.id)
            }}
            wheelAsset={wheelAsset}
            wheelId={wheel.id}
            wheelName={wheel.name}
          />
        )
      })}
    </div>
  )
}
