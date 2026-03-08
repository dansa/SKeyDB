import {getCovenantRecommendationIndex, type AwakenerBuild} from '@/domain/awakener-builds'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'

import {PickerCovenantTile} from './PickerCovenantTile'

interface CovenantPickerGridProps {
  activeBuild?: AwakenerBuild
  filteredCovenants: Covenant[]
  onSetActiveCovenant: (covenantId?: string) => void
}

export function CovenantPickerGrid({
  activeBuild,
  filteredCovenants,
  onSetActiveCovenant,
}: CovenantPickerGridProps) {
  return (
    <div className='grid grid-cols-4 items-start gap-2'>
      <PickerCovenantTile
        isNotSet
        onClick={() => {
          onSetActiveCovenant(undefined)
        }}
      />
      {filteredCovenants.map((covenant) => {
        const covenantAsset = getCovenantAssetById(covenant.id)

        return (
          <PickerCovenantTile
            covenantAsset={covenantAsset}
            covenantId={covenant.id}
            covenantName={covenant.name}
            key={covenant.id}
            onClick={() => {
              onSetActiveCovenant(covenant.id)
            }}
            recommendationLabel={getCovenantRecommendationChipLabel(
              getCovenantRecommendationIndex(activeBuild, covenant.id),
            )}
          />
        )
      })}
    </div>
  )
}

function getCovenantRecommendationChipLabel(index: number): string | undefined {
  if (index < 0) {
    return undefined
  }
  return `#${String(index + 1)}`
}
