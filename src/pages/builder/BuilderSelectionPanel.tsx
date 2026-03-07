import type {RefObject} from 'react'

import {TabbedContainer} from '@/components/ui/TabbedContainer'
import type {Awakener} from '@/domain/awakeners'
import type {AwakenerSortKey, CollectionSortDirection} from '@/domain/collection-sorting'
import type {Covenant} from '@/domain/covenants'
import type {Posse} from '@/domain/posses'
import type {Wheel} from '@/domain/wheels'

import {BuilderSelectionContent} from './BuilderSelectionContent'
import {BuilderSelectionControls} from './BuilderSelectionControls'
import {BuilderSelectionFilters} from './BuilderSelectionFilters'
import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  Team,
  WheelMainstatFilter,
  WheelRarityFilter,
  WheelUsageLocation,
} from './types'

const pickerTabs: {id: PickerTab; label: string}[] = [
  {id: 'awakeners', label: 'Awakeners'},
  {id: 'wheels', label: 'Wheels'},
  {id: 'covenants', label: 'Covenants'},
  {id: 'posses', label: 'Posses'},
]

interface BuilderSelectionPanelProps {
  searchInputRef: RefObject<HTMLInputElement | null>
  pickerTab: PickerTab
  activeSearchQuery: string
  awakenerFilter: AwakenerFilter
  posseFilter: PosseFilter
  wheelRarityFilter: WheelRarityFilter
  wheelMainstatFilter: WheelMainstatFilter
  awakenerSortKey: AwakenerSortKey
  awakenerSortDirection: CollectionSortDirection
  awakenerSortGroupByRealm: boolean
  displayUnowned: boolean
  allowDupes: boolean
  filteredAwakeners: Awakener[]
  filteredPosses: Posse[]
  filteredWheels: Wheel[]
  filteredCovenants: Covenant[]
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
  ownedPosseLevelById: Map<string, number | null>
  teamRealmSet: Set<string>
  usedAwakenerIdentityKeys: Set<string>
  activePosseId?: string
  teams: Team[]
  usedPosseByTeamOrder: Map<string, number>
  usedWheelByTeamOrder: Map<string, WheelUsageLocation>
  effectiveActiveTeamId: string
  onSearchChange: (nextValue: string) => void
  onPickerTabChange: (nextTab: PickerTab) => void
  onAwakenerFilterChange: (nextFilter: AwakenerFilter) => void
  onPosseFilterChange: (nextFilter: PosseFilter) => void
  onWheelRarityFilterChange: (nextFilter: WheelRarityFilter) => void
  onWheelMainstatFilterChange: (nextFilter: WheelMainstatFilter) => void
  onAwakenerSortKeyChange: (nextKey: AwakenerSortKey) => void
  onAwakenerSortDirectionToggle: () => void
  onAwakenerSortGroupByRealmChange: (nextGroupByRealm: boolean) => void
  onDisplayUnownedChange: (displayUnowned: boolean) => void
  onAllowDupesChange: (allowDupes: boolean) => void
  onAwakenerClick: (awakenerName: string) => void
  onSetActiveWheel: (wheelId?: string) => void
  onSetActiveCovenant: (covenantId?: string) => void
  onSetActivePosse: (posseId?: string) => void
}

export function BuilderSelectionPanel({
  searchInputRef,
  pickerTab,
  activeSearchQuery,
  awakenerFilter,
  posseFilter,
  wheelRarityFilter,
  wheelMainstatFilter,
  awakenerSortKey,
  awakenerSortDirection,
  awakenerSortGroupByRealm,
  displayUnowned,
  allowDupes,
  filteredAwakeners,
  filteredPosses,
  filteredWheels,
  filteredCovenants,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  ownedPosseLevelById,
  teamRealmSet,
  usedAwakenerIdentityKeys,
  activePosseId,
  teams,
  usedPosseByTeamOrder,
  usedWheelByTeamOrder,
  effectiveActiveTeamId,
  onSearchChange,
  onPickerTabChange,
  onAwakenerFilterChange,
  onPosseFilterChange,
  onWheelRarityFilterChange,
  onWheelMainstatFilterChange,
  onAwakenerSortKeyChange,
  onAwakenerSortDirectionToggle,
  onAwakenerSortGroupByRealmChange,
  onDisplayUnownedChange,
  onAllowDupesChange,
  onAwakenerClick,
  onSetActiveWheel,
  onSetActiveCovenant,
  onSetActivePosse,
}: BuilderSelectionPanelProps) {
  return (
    <aside className='flex max-h-[calc(100dvh-11.5rem)] min-h-0 flex-col' data-picker-zone='true'>
      <TabbedContainer
        activeTabId={pickerTab}
        bodyClassName='flex min-h-0 flex-1 flex-col p-2'
        className='flex min-h-0 flex-1 flex-col'
        leftEarMaxWidth='100%'
        onTabChange={(tabId) => {
          onPickerTabChange(tabId as PickerTab)
        }}
        tabs={pickerTabs}
      >
        <BuilderSelectionControls
          allowDupes={allowDupes}
          awakenerSortDirection={awakenerSortDirection}
          awakenerSortGroupByRealm={awakenerSortGroupByRealm}
          awakenerSortKey={awakenerSortKey}
          displayUnowned={displayUnowned}
          onAllowDupesChange={onAllowDupesChange}
          onAwakenerSortDirectionToggle={onAwakenerSortDirectionToggle}
          onAwakenerSortGroupByRealmChange={onAwakenerSortGroupByRealmChange}
          onAwakenerSortKeyChange={onAwakenerSortKeyChange}
          onDisplayUnownedChange={onDisplayUnownedChange}
          pickerTab={pickerTab}
        />

        <BuilderSelectionFilters
          activeSearchQuery={activeSearchQuery}
          awakenerFilter={awakenerFilter}
          onAwakenerFilterChange={onAwakenerFilterChange}
          onPosseFilterChange={onPosseFilterChange}
          onSearchChange={onSearchChange}
          onWheelMainstatFilterChange={onWheelMainstatFilterChange}
          onWheelRarityFilterChange={onWheelRarityFilterChange}
          pickerTab={pickerTab}
          posseFilter={posseFilter}
          searchInputRef={searchInputRef}
          wheelMainstatFilter={wheelMainstatFilter}
          wheelRarityFilter={wheelRarityFilter}
        />

        <BuilderSelectionContent
          activePosseId={activePosseId}
          allowDupes={allowDupes}
          effectiveActiveTeamId={effectiveActiveTeamId}
          filteredAwakeners={filteredAwakeners}
          filteredCovenants={filteredCovenants}
          filteredPosses={filteredPosses}
          filteredWheels={filteredWheels}
          onAwakenerClick={onAwakenerClick}
          onSetActiveCovenant={onSetActiveCovenant}
          onSetActivePosse={onSetActivePosse}
          onSetActiveWheel={onSetActiveWheel}
          ownedAwakenerLevelByName={ownedAwakenerLevelByName}
          ownedPosseLevelById={ownedPosseLevelById}
          ownedWheelLevelById={ownedWheelLevelById}
          pickerTab={pickerTab}
          teamRealmSet={teamRealmSet}
          teams={teams}
          usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
          usedPosseByTeamOrder={usedPosseByTeamOrder}
          usedWheelByTeamOrder={usedWheelByTeamOrder}
        />
      </TabbedContainer>
    </aside>
  )
}
