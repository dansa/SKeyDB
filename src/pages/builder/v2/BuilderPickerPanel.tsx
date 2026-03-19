import {useCallback, useMemo, useRef} from 'react'

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
import {useGlobalPickerSearchCapture} from '../useGlobalPickerSearchCapture'
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
  return `flex h-6 items-center justify-center border transition-colors ${
    isActive
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45 hover:bg-slate-900/78 hover:text-slate-100'
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
  layoutVariant?: 'stacked' | 'wide-sidebar'
  onItemSelected?: () => void
}

export function BuilderPickerPanel({
  actions,
  hideTabs = false,
  enableDragAndDrop = true,
  layoutVariant = 'stacked',
  onItemSelected,
}: BuilderPickerPanelProps) {
  const isWideSidebar = layoutVariant === 'wide-sidebar'
  const pickerTab = useBuilderStore(selectPickerTab)
  const setPickerTab = useBuilderStore((s) => s.setPickerTab)
  const setPickerSearchQuery = useBuilderStore((s) => s.setPickerSearchQuery)
  const activeTeamId = useBuilderStore(selectActiveTeamId)
  const activeTeam = useBuilderStore(selectActiveTeam)
  const activeSlots = useBuilderStore(selectActiveTeamSlots)
  const activeSelection = useBuilderStore(selectActiveSelection)
  const teams = useBuilderStore(selectTeams)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const picker = useBuilderPickerState(pickerTab, activeSelection, activeSlots)
  const {setNodeRef: setDropRef} = useDroppable({id: PICKER_DROP_ZONE_ID})

  const handleAppendSearchCharacter = useCallback(
    (tab: PickerTab, key: string) => {
      const currentQuery = useBuilderStore.getState().pickerSearchByTab[tab]
      setPickerSearchQuery(tab, `${currentQuery}${key}`)
    },
    [setPickerSearchQuery],
  )

  useGlobalPickerSearchCapture({
    pickerTab,
    searchInputRef,
    onAppendCharacter: handleAppendSearchCharacter,
  })

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

  const searchBlock = (
    <div className={isWideSidebar ? 'px-2 py-2' : 'px-2 pt-1.5'}>
      <input
        className='w-full border border-slate-500/45 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-amber-300/50 focus:outline-none'
        onChange={(event) => {
          picker.setSearchQuery(event.target.value)
        }}
        placeholder={getPickerSearchPlaceholder(pickerTab)}
        ref={searchInputRef}
        type='search'
        value={picker.searchQuery}
      />
    </div>
  )

  const filterContent =
    pickerTab === 'awakeners' ? (
      <div
        className={isWideSidebar ? 'grid grid-cols-2 gap-1' : 'grid grid-cols-5 gap-1'}
        data-layout={layoutVariant}
        data-testid='builder-picker-filter-groups'
      >
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
    ) : pickerTab === 'posses' ? (
      <div
        className={isWideSidebar ? 'grid grid-cols-2 gap-1' : 'grid grid-cols-3 gap-1'}
        data-layout={layoutVariant}
        data-testid='builder-picker-filter-groups'
      >
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
    ) : pickerTab === 'wheels' ? (
      <div
        className='space-y-1'
        data-layout={layoutVariant}
        data-testid='builder-picker-filter-groups'
      >
        <div className={isWideSidebar ? 'grid grid-cols-2 gap-1' : 'grid grid-cols-4 gap-1'}>
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
        <div className={isWideSidebar ? 'grid grid-cols-3 gap-1' : 'grid grid-cols-9 gap-1'}>
          {wheelMainstatFilterOptions.map((filterTab) => (
            <button
              aria-label={`Filter wheels by ${filterTab.label}`}
              aria-pressed={picker.wheelMainstatFilter === filterTab.id}
              className={`flex ${isWideSidebar ? 'h-6' : 'h-7'} items-center justify-center border transition-colors ${
                picker.wheelMainstatFilter === filterTab.id
                  ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                  : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45 hover:bg-slate-900/78 hover:text-slate-100'
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
                  className='h-[14px] w-[14px] object-contain opacity-95'
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
    ) : null

  const controls = (
    <>
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

      {searchBlock}

      {filterContent ? (
        <div className={isWideSidebar ? 'px-2 pb-2' : 'px-2 pt-1.5'}>{filterContent}</div>
      ) : null}
    </>
  )

  const pickerTabs = hideTabs ? null : (
    <div className='flex border-b border-slate-600/50' data-testid='builder-picker-tab-bar'>
      {pickerTabItems.map((tab) => (
        <button
          className={`min-w-0 flex-1 border-b-2 px-2 py-2 text-xs font-medium transition-[background-color,border-color,color] ${
            pickerTab === tab.id
              ? 'border-amber-300/70 bg-slate-900/45 text-amber-100'
              : 'border-transparent text-slate-400 hover:border-amber-300/45 hover:bg-slate-900/35 hover:text-slate-200'
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
  )

  return (
    <div
      className='flex h-full min-h-0 flex-col bg-slate-950/85'
      data-layout-variant={layoutVariant}
      data-testid='builder-picker-panel'
    >
      {!isWideSidebar ? pickerTabs : null}
      <div className={`min-h-0 flex-1 ${isWideSidebar ? 'flex overflow-hidden' : 'flex flex-col'}`}>
        {isWideSidebar ? (
          <aside
            className='themed-scrollbar min-h-0 w-[clamp(13rem,22vw,15.5rem)] max-w-[15.5rem] min-w-[13rem] overflow-y-auto border-r border-slate-500/45 bg-slate-950/55'
            data-testid='builder-picker-controls-rail'
          >
            {controls}
          </aside>
        ) : (
          controls
        )}

        <section
          className={
            isWideSidebar ? 'flex min-h-0 min-w-0 flex-1 flex-col' : 'flex min-h-0 flex-1 flex-col'
          }
          data-testid={isWideSidebar ? 'builder-picker-results-shell' : undefined}
        >
          {isWideSidebar ? pickerTabs : null}
          <div
            className={`themed-scrollbar min-h-0 ${
              isWideSidebar
                ? 'min-w-0 flex-1 overflow-y-auto px-2 py-2'
                : 'mt-2 flex-1 overflow-y-auto px-2 pb-2'
            }`}
            data-testid='builder-picker-results-pane'
            ref={setDropRef}
            style={{overscrollBehaviorY: 'contain'}}
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
        </section>
      </div>
    </div>
  )
}
