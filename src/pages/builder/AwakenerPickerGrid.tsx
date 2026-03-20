import {getAwakenerIdentityKey} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'

import {PickerAwakenerTile} from './PickerAwakenerTile'

interface AwakenerPickerGridProps {
  filteredAwakeners: Awakener[]
  teamRealmSet: Set<string>
  usedAwakenerIdentityKeys: Set<string>
  ownedAwakenerLevelByName: Map<string, number | null>
  enableDragAndDrop?: boolean
  allowDupes: boolean
  onAwakenerClick: (awakenerName: string) => void
}

export function AwakenerPickerGrid({
  filteredAwakeners,
  teamRealmSet,
  usedAwakenerIdentityKeys,
  ownedAwakenerLevelByName,
  enableDragAndDrop = true,
  allowDupes,
  onAwakenerClick,
}: AwakenerPickerGridProps) {
  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(var(--builder-picker-tile-min-width,80px),1fr))] gap-1.5'>
      {filteredAwakeners.map((awakener) => (
        <PickerAwakenerTile
          awakenerName={awakener.name}
          enableDragAndDrop={enableDragAndDrop}
          isInUse={
            !allowDupes && usedAwakenerIdentityKeys.has(getAwakenerIdentityKey(awakener.name))
          }
          isOwned={(ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null}
          isRealmBlocked={
            teamRealmSet.size >= 2 && !teamRealmSet.has(awakener.realm.trim().toUpperCase())
          }
          key={awakener.name}
          onClick={() => {
            onAwakenerClick(awakener.name)
          }}
          realm={awakener.realm}
        />
      ))}
    </div>
  )
}
