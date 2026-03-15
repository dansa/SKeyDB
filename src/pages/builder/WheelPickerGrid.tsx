import {
  getWheelRecommendationTier,
  isWheelMainstatRecommended,
  type AwakenerBuild,
} from '@/domain/awakener-builds'
import {getWheelAssetById} from '@/domain/wheel-assets'
import type {Wheel} from '@/domain/wheels'

import {PickerWheelTile} from './PickerWheelTile'
import type {WheelUsageLocation} from './types'

function getWheelBlockedText(
  usedByTeam: WheelUsageLocation | undefined,
  effectiveActiveTeamId: string,
): string | null {
  if (!usedByTeam) {
    return null
  }

  if (usedByTeam.teamId !== effectiveActiveTeamId) {
    return `Team ${String(usedByTeam.teamOrder + 1)}`
  }

  return 'In Use'
}

interface WheelPickerGridProps {
  activeBuild?: AwakenerBuild
  filteredWheels: Wheel[]
  allowDupes: boolean
  enableDragAndDrop?: boolean
  effectiveActiveTeamId: string
  ownedWheelLevelById: Map<string, number | null>
  promoteMatchingWheelMainstats: boolean
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  onSetActiveWheel: (wheelId?: string) => void
}

export function WheelPickerGrid({
  activeBuild,
  filteredWheels,
  allowDupes,
  enableDragAndDrop = true,
  effectiveActiveTeamId,
  ownedWheelLevelById,
  promoteMatchingWheelMainstats,
  usedWheelByTeamOrder,
  onSetActiveWheel,
}: WheelPickerGridProps) {
  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] items-start gap-2'>
      <PickerWheelTile
        enableDragAndDrop={enableDragAndDrop}
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
            enableDragAndDrop={enableDragAndDrop}
            isBlocked={Boolean(isUsedByOtherTeam)}
            isInUse={Boolean(usedByTeam)}
            isOwned={(ownedWheelLevelById.get(wheel.id) ?? null) !== null}
            key={wheel.id}
            onClick={() => {
              onSetActiveWheel(wheel.id)
            }}
            recommendationLabel={getWheelRecommendationChipLabel(
              getWheelRecommendationTier(activeBuild, wheel.id),
            )}
            recommendedMainstatKey={
              promoteMatchingWheelMainstats &&
              activeBuild &&
              isWheelMainstatRecommended(activeBuild, wheel.mainstatKey)
                ? wheel.mainstatKey
                : undefined
            }
            wheelAsset={wheelAsset}
            wheelId={wheel.id}
            wheelName={wheel.name}
          />
        )
      })}
    </div>
  )
}

function getWheelRecommendationChipLabel(
  tier: ReturnType<typeof getWheelRecommendationTier>,
): string | undefined {
  switch (tier) {
    case 'BIS_SSR':
      return 'BiS'
    case 'ALT_SSR':
      return 'Alt'
    case 'BIS_SR':
      return 'BiS SR'
    case 'GOOD':
      return 'Good'
    default:
      return undefined
  }
}
