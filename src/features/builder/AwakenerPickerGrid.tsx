import {getAwakenerIdentityKeyById} from '@/domain/awakener-identity'
import type {Awakener} from '@/domain/awakeners'

import {PickerAwakenerTile} from './PickerAwakenerTile'

interface AwakenerPickerGridProps {
  filteredAwakeners: Awakener[]
  teamRealmSet: Set<string>
  usedAwakenerIdentityKeys: Set<string>
  ownedAwakenerLevelByName: Map<string, number | null>
  allowDupes: boolean
  onAwakenerClick: (awakenerId: string) => void
  onOpenAwakenerDetail: (awakener: Awakener) => void
}

export function AwakenerPickerGrid({
  filteredAwakeners,
  teamRealmSet,
  usedAwakenerIdentityKeys,
  ownedAwakenerLevelByName,
  allowDupes,
  onAwakenerClick,
  onOpenAwakenerDetail,
}: AwakenerPickerGridProps) {
  return (
    <div className='grid grid-cols-[repeat(4,minmax(0,1fr))] gap-1.5'>
      {filteredAwakeners.map((awakener) => (
        <PickerAwakenerTile
          awakenerId={awakener.id}
          awakenerName={awakener.name}
          isInUse={
            !allowDupes && usedAwakenerIdentityKeys.has(getAwakenerIdentityKeyById(awakener.id))
          }
          isOwned={(ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null}
          isRealmBlocked={
            teamRealmSet.size >= 2 && !teamRealmSet.has(awakener.realm.trim().toUpperCase())
          }
          key={awakener.id}
          onClick={() => {
            onAwakenerClick(awakener.id)
          }}
          onOpenDetail={() => {
            onOpenAwakenerDetail(awakener)
          }}
          realm={awakener.realm}
        />
      ))}
    </div>
  )
}
