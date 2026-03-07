import {getAwakenerIdentityKey} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'

import {PickerAwakenerTile} from './PickerAwakenerTile'

interface AwakenerPickerGridProps {
  filteredAwakeners: Awakener[]
  teamRealmSet: Set<string>
  usedAwakenerIdentityKeys: Set<string>
  ownedAwakenerLevelByName: Map<string, number | null>
  allowDupes: boolean
  onAwakenerClick: (awakenerName: string) => void
}

export function AwakenerPickerGrid({
  filteredAwakeners,
  teamRealmSet,
  usedAwakenerIdentityKeys,
  ownedAwakenerLevelByName,
  allowDupes,
  onAwakenerClick,
}: AwakenerPickerGridProps) {
  return (
    <div className='grid grid-cols-4 gap-1.5'>
      {filteredAwakeners.map((awakener) => (
        <PickerAwakenerTile
          awakenerName={awakener.name}
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
