import type {Awakener} from '@/domain/awakeners'
import type {Covenant} from '@/domain/covenants'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

import {AwakenerPickerGrid} from './AwakenerPickerGrid'
import {CovenantPickerGrid} from './CovenantPickerGrid'
import {PICKER_DROP_ZONE_ID} from './dnd-ids'
import {PickerDropZone} from './PickerDropZone'
import {PossePickerGrid} from './PossePickerGrid'
import type {PickerTab, Team, WheelUsageLocation} from './types'
import {WheelPickerGrid} from './WheelPickerGrid'

interface BuilderSelectionContentProps {
  pickerTab: PickerTab
  allowDupes: boolean
  effectiveActiveTeamId: string
  filteredAwakeners: Awakener[]
  filteredWheels: Wheel[]
  filteredCovenants: Covenant[]
  filteredPosses: Posse[]
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
  ownedPosseLevelById: Map<string, number | null>
  teamRealmSet: Set<string>
  usedAwakenerIdentityKeys: Set<string>
  activePosseId?: string
  teams: Team[]
  usedPosseByTeamOrder: Map<string, number>
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  onAwakenerClick: (awakenerName: string) => void
  onSetActiveWheel: (wheelId?: string) => void
  onSetActiveCovenant: (covenantId?: string) => void
  onSetActivePosse: (posseId?: string) => void
}

export function BuilderSelectionContent({
  pickerTab,
  allowDupes,
  effectiveActiveTeamId,
  filteredAwakeners,
  filteredWheels,
  filteredCovenants,
  filteredPosses,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  ownedPosseLevelById,
  teamRealmSet,
  usedAwakenerIdentityKeys,
  activePosseId,
  teams,
  usedPosseByTeamOrder,
  usedWheelByTeamOrder,
  onAwakenerClick,
  onSetActiveWheel,
  onSetActiveCovenant,
  onSetActivePosse,
}: BuilderSelectionContentProps) {
  return (
    <>
      <p className='mt-2 text-xs text-slate-200'>
        Drag and drop from the list to deploy or replace, clicking replaces the active slot, or
        fills an empty one if available.{' '}
      </p>

      <PickerDropZone
        className='builder-picker-scrollbar mt-3 min-h-0 flex-1 overflow-auto pr-1'
        id={PICKER_DROP_ZONE_ID}
      >
        {pickerTab === 'awakeners' ? (
          <AwakenerPickerGrid
            allowDupes={allowDupes}
            filteredAwakeners={filteredAwakeners}
            onAwakenerClick={onAwakenerClick}
            ownedAwakenerLevelByName={ownedAwakenerLevelByName}
            teamRealmSet={teamRealmSet}
            usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
          />
        ) : null}

        {pickerTab === 'wheels' ? (
          <WheelPickerGrid
            allowDupes={allowDupes}
            effectiveActiveTeamId={effectiveActiveTeamId}
            filteredWheels={filteredWheels}
            onSetActiveWheel={onSetActiveWheel}
            ownedWheelLevelById={ownedWheelLevelById}
            usedWheelByTeamOrder={usedWheelByTeamOrder}
          />
        ) : null}

        {pickerTab === 'covenants' ? (
          <CovenantPickerGrid
            filteredCovenants={filteredCovenants}
            onSetActiveCovenant={onSetActiveCovenant}
          />
        ) : null}

        {pickerTab === 'posses' ? (
          <PossePickerGrid
            activePosseId={activePosseId}
            allowDupes={allowDupes}
            effectiveActiveTeamId={effectiveActiveTeamId}
            filteredPosses={filteredPosses}
            onSetActivePosse={onSetActivePosse}
            ownedPosseLevelById={ownedPosseLevelById}
            teams={teams}
            usedPosseByTeamOrder={usedPosseByTeamOrder}
          />
        ) : null}
      </PickerDropZone>
    </>
  )
}
