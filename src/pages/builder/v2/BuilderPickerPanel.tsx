import {useCallback, useMemo} from 'react'

import {useDroppable} from '@dnd-kit/core'

import {getAwakenerIdentityKey} from '@/domain/awakener-identity'

import {AwakenerPickerGrid} from '../AwakenerPickerGrid'
import {CovenantPickerGrid} from '../CovenantPickerGrid'
import {PICKER_DROP_ZONE_ID} from '../dnd-ids'
import {PossePickerGrid} from '../PossePickerGrid'
import {getTeamRealmSet} from '../team-state'
import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  WheelMainstatFilter,
  WheelRarityFilter,
} from '../types'
import {buildUsedPosseByTeamOrder, buildUsedWheelByTeamOrder} from '../usage-maps'
import {wheelMainstatFilterOptions} from '../wheel-mainstats'
import {WheelPickerGrid} from '../WheelPickerGrid'
import {PickerSortingToggles} from './PickerSortingToggles'
import {useBuilderStore} from './store/builder-store'
import {
  selectActiveSelection,
  selectActiveTeam,
  selectActiveTeamId,
  selectActiveTeamSlots,
  selectPickerTab,
  selectTeams,
} from './store/selectors'
import {useBuilderPickerState} from './useBuilderPickerState'
import type {BuilderV2ActionsResult} from './useBuilderV2Actions'

const pickerTabItems: {id: PickerTab; label: string}[] = [
  {id: 'awakeners', label: 'Awakeners'},
  {id: 'wheels', label: 'Wheels'},
  {id: 'covenants', label: 'Covenants'},
  {id: 'posses', label: 'Posses'},
]

const awakenerFilterTabs: {id: AwakenerFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
]

const posseFilterTabs: {id: PosseFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'FADED_LEGACY', label: 'Faded Legacy'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
]

const wheelRarityFilterTabs: {id: WheelRarityFilter; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'SSR', label: 'SSR'},
  {id: 'SR', label: 'SR'},
  {id: 'R', label: 'R'},
]

function getPickerSearchPlaceholder(pickerTab: PickerTab): string {
  if (pickerTab === 'awakeners') {
    return 'Search awakeners (name, realm, aliases)'
  }
  if (pickerTab === 'posses') {
    return 'Search posses (name, realm, awakener)'
  }
  if (pickerTab === 'wheels') {
    return 'Search wheels (name, rarity, realm, awakener, main stat)'
  }
  return 'Search covenants (name, id)'
}

function getCompactFilterChipClassName(isActive: boolean): string {
  return `border transition-colors ${
    isActive
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

interface BuilderPickerPanelProps {
  actions: Pick<
    BuilderV2ActionsResult,
    | 'handleDropPickerAwakener'
    | 'handleDropPickerCovenant'
    | 'handleDropPickerWheel'
    | 'handlePickerAwakenerClick'
    | 'handlePickerCovenantClick'
    | 'handlePickerWheelClick'
    | 'handleSetActivePosse'
  >
  hideTabs?: boolean
  enableDragAndDrop?: boolean
  onItemSelected?: () => void
}

export function BuilderPickerPanel({
  actions,
  hideTabs = false,
  enableDragAndDrop = true,
  onItemSelected,
}: BuilderPickerPanelProps) {
  const pickerTab = useBuilderStore(selectPickerTab)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const activeSlots = useBuilderStore(selectActiveTeamSlots)
  const activeSelection = useBuilderStore(selectActiveSelection)
  const teams = useBuilderStore(selectTeams)

  const picker = useBuilderPickerState(pickerTab, activeSelection, activeSlots)
  const {setNodeRef: setDropRef} = useDroppable({id: PICKER_DROP_ZONE_ID})

  const teamRealmSet = useMemo(() => {
    return getTeamRealmSet(activeSlots, {
      excludeSlotId: activeSelection?.kind === 'awakener' ? activeSelection.slotId : undefined,
    })
  }, [activeSelection, activeSlots])

  const usedAwakenerIdentityKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const team of teams) {
      for (const slot of team.slots) {
        if (slot.awakenerName && !slot.isSupport) {
          keys.add(getAwakenerIdentityKey(slot.awakenerName))
        }
      }
    }
    return keys
  }, [teams])

  const usedWheelByTeamOrder = useMemo(() => {
    return buildUsedWheelByTeamOrder(teams)
  }, [teams])

  const usedPosseByTeamOrder = useMemo(() => {
    return buildUsedPosseByTeamOrder(teams)
  }, [teams])

  const handleAwakenerClick = useCallback(
    (name: string) => {
      actions.handlePickerAwakenerClick(name, onItemSelected)
    },
    [actions, onItemSelected],
  )

  const handleSetWheel = useCallback(
    (wheelId?: string) => {
      actions.handlePickerWheelClick(wheelId, onItemSelected)
    },
    [actions, onItemSelected],
  )

  const handleSetCovenant = useCallback(
    (covenantId?: string) => {
      actions.handlePickerCovenantClick(covenantId, onItemSelected)
    },
    [actions, onItemSelected],
  )

  const handleSetPosse = useCallback(
    (posseId?: string) => {
      actions.handleSetActivePosse(posseId, onItemSelected)
    },
    [actions, onItemSelected],
  )

  return (
    <div className='flex h-full min-h-0 flex-col bg-slate-950/85'>
      {hideTabs ? null : (
        <div className='flex border-b border-slate-600/50'>
          {pickerTabItems.map((tab) => (
            <button
              className={`min-w-0 flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                pickerTab === tab.id
                  ? 'border-b-2 border-amber-300/70 text-amber-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              key={tab.id}
              onClick={() => {
                setPickerTab(tab.id)
              }}
              type='button'
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <PickerSortingToggles
        allowDupes={picker.allowDupes}
        awakenerSortDirection={picker.awakenerSortDirection}
        awakenerSortGroupByRealm={picker.awakenerSortGroupByRealm}
        awakenerSortKey={picker.awakenerSortKey}
        displayUnowned={picker.displayUnowned}
        onAllowDupesChange={picker.setAllowDupes}
        onAwakenerSortDirectionToggle={picker.toggleAwakenerSortDirection}
        onAwakenerSortGroupByRealmChange={picker.setAwakenerSortGroupByRealm}
        onAwakenerSortKeyChange={picker.setAwakenerSortKey}
        onDisplayUnownedChange={picker.setDisplayUnowned}
        onPromoteMatchingWheelMainstatsChange={picker.setPromoteMatchingWheelMainstats}
        onPromoteRecommendedGearChange={picker.setPromoteRecommendedGear}
        onSinkUnownedToBottomChange={picker.setSinkUnownedToBottom}
        pickerTab={pickerTab}
        promoteMatchingWheelMainstats={picker.promoteMatchingWheelMainstats}
        promoteRecommendedGear={picker.promoteRecommendedGear}
        sinkUnownedToBottom={picker.sinkUnownedToBottom}
      />

      <div className='px-2 pt-1.5'>
        <input
          className='w-full border border-slate-500/45 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-300/50 focus:outline-none'
          onChange={(event) => {
            picker.setSearchQuery(event.target.value)
          }}
          placeholder={getPickerSearchPlaceholder(pickerTab)}
          type='search'
          value={picker.searchQuery}
        />
      </div>

      {pickerTab === 'awakeners' ? (
        <div className='px-2 pt-1.5'>
          <div className='grid grid-cols-5 gap-1'>
            {awakenerFilterTabs.map((filterTab) => (
              <button
                className={getCompactFilterChipClassName(picker.awakenerFilter === filterTab.id)}
                key={filterTab.id}
                onClick={() => {
                  picker.setAwakenerFilter(filterTab.id)
                }}
                type='button'
              >
                {filterTab.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {pickerTab === 'posses' ? (
        <div className='px-2 pt-1.5'>
          <div className='grid grid-cols-3 gap-1'>
            {posseFilterTabs.map((filterTab) => (
              <button
                className={getCompactFilterChipClassName(picker.posseFilter === filterTab.id)}
                key={filterTab.id}
                onClick={() => {
                  picker.setPosseFilter(filterTab.id)
                }}
                type='button'
              >
                {filterTab.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {pickerTab === 'wheels' ? (
        <div className='space-y-1.5 px-2 pt-1.5'>
          <div className='grid grid-cols-4 gap-1'>
            {wheelRarityFilterTabs.map((filterTab) => (
              <button
                aria-pressed={picker.wheelRarityFilter === filterTab.id}
                className={getCompactFilterChipClassName(picker.wheelRarityFilter === filterTab.id)}
                key={filterTab.id}
                onClick={() => {
                  picker.setWheelRarityFilter(filterTab.id)
                }}
                type='button'
              >
                {filterTab.label}
              </button>
            ))}
          </div>
          <div className='grid grid-cols-9 gap-1'>
            {wheelMainstatFilterOptions.map((filterTab) => (
              <button
                aria-label={`Filter wheels by ${filterTab.label}`}
                aria-pressed={picker.wheelMainstatFilter === filterTab.id}
                className={`flex h-7 items-center justify-center border transition-colors ${
                  picker.wheelMainstatFilter === filterTab.id
                    ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                    : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                }`}
                key={filterTab.id}
                onClick={() => {
                  picker.setWheelMainstatFilter(filterTab.id as WheelMainstatFilter)
                }}
                title={filterTab.label}
                type='button'
              >
                {filterTab.iconAsset ? (
                  <img
                    alt={filterTab.label}
                    className='h-[17px] w-[17px] object-contain opacity-95'
                    draggable={false}
                    src={filterTab.iconAsset}
                  />
                ) : (
                  <span className='text-[10px] tracking-wide uppercase'>All</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className='themed-scrollbar mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-2'
        ref={setDropRef}
      >
        {pickerTab === 'awakeners' ? (
          <AwakenerPickerGrid
            enableDragAndDrop={enableDragAndDrop}
            allowDupes={picker.allowDupes}
            filteredAwakeners={picker.filteredAwakeners}
            onAwakenerClick={handleAwakenerClick}
            ownedAwakenerLevelByName={picker.ownedAwakenerLevelByName}
            teamRealmSet={teamRealmSet}
            usedAwakenerIdentityKeys={usedAwakenerIdentityKeys}
          />
        ) : null}

        {pickerTab === 'wheels' ? (
          <WheelPickerGrid
            activeBuild={picker.activeBuild}
            allowDupes={picker.allowDupes}
            enableDragAndDrop={enableDragAndDrop}
            effectiveActiveTeamId={activeTeamId}
            filteredWheels={picker.filteredWheels}
            onSetActiveWheel={handleSetWheel}
            ownedWheelLevelById={picker.ownedWheelLevelById}
            promoteMatchingWheelMainstats={picker.promoteMatchingWheelMainstats}
            usedWheelByTeamOrder={usedWheelByTeamOrder}
          />
        ) : null}

        {pickerTab === 'covenants' ? (
          <CovenantPickerGrid
            activeBuild={picker.activeBuild}
            enableDragAndDrop={enableDragAndDrop}
            filteredCovenants={picker.filteredCovenants}
            onSetActiveCovenant={handleSetCovenant}
          />
        ) : null}

        {pickerTab === 'posses' ? (
          <PossePickerGrid
            activePosseId={activeTeam?.posseId ?? undefined}
            allowDupes={picker.allowDupes}
            enableDragAndDrop={enableDragAndDrop}
            effectiveActiveTeamId={activeTeamId}
            filteredPosses={picker.filteredPosses}
            onSetActivePosse={handleSetPosse}
            ownedPosseLevelById={picker.ownedPosseLevelById}
            teamRecommendedPosseIds={picker.teamRecommendedPosseIds}
            teams={teams}
            usedPosseByTeamOrder={usedPosseByTeamOrder}
          />
        ) : null}
      </div>
    </div>
  )
}
