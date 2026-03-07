import {getCovenantAssetById} from '@/domain/covenant-assets'
import type {Covenant} from '@/domain/covenants'

import {PickerCovenantTile} from './PickerCovenantTile'

interface CovenantPickerGridProps {
  filteredCovenants: Covenant[]
  onSetActiveCovenant: (covenantId?: string) => void
}

export function CovenantPickerGrid({
  filteredCovenants,
  onSetActiveCovenant,
}: CovenantPickerGridProps) {
  return (
    <div className='grid grid-cols-4 gap-2'>
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
          />
        )
      })}
    </div>
  )
}
