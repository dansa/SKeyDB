import {getCovenantRecommendationIndex, type AwakenerBuild} from '@/domain/awakener-builds'
import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'

import {PickerCovenantTile} from './PickerCovenantTile'

interface CovenantPickerGridProps {
  activeBuild?: AwakenerBuild
  enableDragAndDrop?: boolean
  filteredCovenants: Covenant[]
  onSetActiveCovenant: (covenantId?: string) => void
}

export function CovenantPickerGrid({
  activeBuild,
  enableDragAndDrop = true,
  filteredCovenants,
  onSetActiveCovenant,
}: CovenantPickerGridProps) {
  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(var(--builder-picker-tile-min-width,80px),1fr))] items-start gap-2'>
      <PickerCovenantTile
        enableDragAndDrop={enableDragAndDrop}
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
            enableDragAndDrop={enableDragAndDrop}
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
