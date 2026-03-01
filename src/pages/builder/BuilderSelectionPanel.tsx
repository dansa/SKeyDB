import { useEffect, useState, type RefObject } from 'react'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import type { Awakener } from '../../domain/awakeners'
import type { Covenant } from '../../domain/covenants'
import type { Posse } from '../../domain/posses'
import type { Wheel } from '../../domain/wheels'
import { getCovenantAssetById } from '../../domain/covenant-assets'
import { getPosseAssetById } from '../../domain/posse-assets'
import { getWheelAssetById } from '../../domain/wheel-assets'
import { OwnedTogglePill } from '../../components/ui/OwnedTogglePill'
import { TabbedContainer } from '../../components/ui/TabbedContainer'
import { CollectionSortControls } from '../../components/ui/CollectionSortControls'
import { Button } from '../../components/ui/Button'
import { FaChevronDown, FaChevronRight } from 'react-icons/fa6'
import { PICKER_DROP_ZONE_ID } from './dnd-ids'
import { PickerCovenantTile } from './PickerCovenantTile'
import { PickerDropZone } from './PickerDropZone'
import { PickerAwakenerTile } from './PickerAwakenerTile'
import { PickerWheelTile } from './PickerWheelTile'
import { wheelMainstatFilterOptions } from './wheel-mainstats'
import type {
  AwakenerSortKey,
  CollectionSortDirection,
} from '../../domain/collection-sorting'
import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  Team,
  WheelMainstatFilter,
  WheelRarityFilter,
  WheelUsageLocation,
} from './types'
import { toOrdinal } from './utils'

const pickerTabs: Array<{ id: PickerTab; label: string }> = [
  { id: 'awakeners', label: 'Awakeners' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'covenants', label: 'Covenants' },
  { id: 'posses', label: 'Posses' },
]

const awakenerFilterTabs: Array<{ id: AwakenerFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'AEQUOR', label: 'Aequor' },
  { id: 'CARO', label: 'Caro' },
  { id: 'CHAOS', label: 'Chaos' },
  { id: 'ULTRA', label: 'Ultra' },
]

const posseFilterTabs: Array<{ id: PosseFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'FADED_LEGACY', label: 'Faded Legacy' },
  { id: 'AEQUOR', label: 'Aequor' },
  { id: 'CARO', label: 'Caro' },
  { id: 'CHAOS', label: 'Chaos' },
  { id: 'ULTRA', label: 'Ultra' },
]

const wheelRarityFilterTabs: Array<{ id: WheelRarityFilter; label: string }> = [
  { id: 'ALL', label: 'All' },
  { id: 'SSR', label: 'SSR' },
  { id: 'SR', label: 'SR' },
  { id: 'R', label: 'R' },
]

const BUILDER_AWAKENER_SORT_EXPANDED_KEY = 'skeydb.builder.awakenerSortExpanded.v1'

type BuilderSelectionPanelProps = {
  searchInputRef: RefObject<HTMLInputElement | null>
  pickerTab: PickerTab
  activeSearchQuery: string
  awakenerFilter: AwakenerFilter
  posseFilter: PosseFilter
  wheelRarityFilter: WheelRarityFilter
  wheelMainstatFilter: WheelMainstatFilter
  awakenerSortKey: AwakenerSortKey
  awakenerSortDirection: CollectionSortDirection
  awakenerSortGroupByFaction: boolean
  displayUnowned: boolean
  allowDupes: boolean
  filteredAwakeners: Awakener[]
  filteredPosses: Posse[]
  filteredWheels: Wheel[]
  filteredCovenants: Covenant[]
  ownedAwakenerLevelByName: Map<string, number | null>
  ownedWheelLevelById: Map<string, number | null>
  ownedPosseLevelById: Map<string, number | null>
  teamFactionSet: Set<string>
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
  onAwakenerSortGroupByFactionChange: (nextGroupByFaction: boolean) => void
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
  awakenerSortGroupByFaction,
  displayUnowned,
  allowDupes,
  filteredAwakeners,
  filteredPosses,
  filteredWheels,
  filteredCovenants,
  ownedAwakenerLevelByName,
  ownedWheelLevelById,
  ownedPosseLevelById,
  teamFactionSet,
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
  onAwakenerSortGroupByFactionChange,
  onDisplayUnownedChange,
  onAllowDupesChange,
  onAwakenerClick,
  onSetActiveWheel,
  onSetActiveCovenant,
  onSetActivePosse,
}: BuilderSelectionPanelProps) {
  const [isAwakenerSortExpanded, setIsAwakenerSortExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    try {
      return window.localStorage.getItem(BUILDER_AWAKENER_SORT_EXPANDED_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(BUILDER_AWAKENER_SORT_EXPANDED_KEY, isAwakenerSortExpanded ? '1' : '0')
    } catch {
      // Ignore storage failures.
    }
  }, [isAwakenerSortExpanded])

  return (
    <aside
      className="flex max-h-[calc(100dvh-11.5rem)] min-h-0 flex-col"
      data-picker-zone="true"
    >
      <TabbedContainer
        activeTabId={pickerTab}
        bodyClassName="flex min-h-0 flex-1 flex-col p-2"
        className="flex min-h-0 flex-1 flex-col"
        leftEarMaxWidth="100%"
        onTabChange={(tabId) => onPickerTabChange(tabId as PickerTab)}
        tabs={pickerTabs}
      >
      <div className="mt-2">
        <Button
          aria-expanded={isAwakenerSortExpanded}
          className="w-full px-2 py-1.5 text-[11px] tracking-wide"
          onClick={() => setIsAwakenerSortExpanded((current) => !current)}
          type="button"
          variant="secondary"
        >
          <span className="inline-flex w-full items-center justify-between gap-2">
            <span className="uppercase">Sorting & Toggles</span>
            {isAwakenerSortExpanded ? (
              <FaChevronDown aria-hidden className="text-[13px]" />
            ) : (
              <FaChevronRight aria-hidden className="text-[13px]" />
            )}
          </span>
        </Button>
        <div
          className={
            isAwakenerSortExpanded
              ? '-mt-px space-y-2 border border-slate-500/45 bg-slate-900/45 p-2'
              : 'hidden'
          }
        >
          {pickerTab === 'awakeners' ? (
            <CollectionSortControls
              groupByFaction={awakenerSortGroupByFaction}
              layout="stacked"
              onGroupByFactionChange={onAwakenerSortGroupByFactionChange}
              onSortDirectionToggle={onAwakenerSortDirectionToggle}
              onSortKeyChange={onAwakenerSortKeyChange}
              sortDirection={awakenerSortDirection}
              sortDirectionAriaLabel="Toggle builder awakener sort direction"
              sortKey={awakenerSortKey}
              sortSelectAriaLabel="Builder awakener sort key"
            />
          ) : null}
          <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
            <span>Display Unowned</span>
            <OwnedTogglePill
              className="ownership-pill-builder"
              offLabel="Off"
              onLabel="On"
              onToggle={() => onDisplayUnownedChange(!displayUnowned)}
              owned={displayUnowned}
              variant="flat"
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
            <span>Allow Dupes</span>
            <OwnedTogglePill
              className="ownership-pill-builder"
              offLabel="Off"
              onLabel="On"
              onToggle={() => onAllowDupesChange(!allowDupes)}
              owned={allowDupes}
              variant="flat"
            />
          </div>
        </div>
      </div>
      <input
        className="mt-3 w-full border border-slate-800/95 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] focus:border-amber-300/65 focus:bg-slate-950"
        ref={searchInputRef}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={
          pickerTab === 'awakeners'
            ? 'Search awakeners (name, faction, aliases)'
            : pickerTab === 'posses'
              ? 'Search posses (name, realm, awakener)'
              : pickerTab === 'wheels'
                ? 'Search wheels (name, rarity, faction, awakener, main stat)'
                : 'Search covenants (name, id)'
        }
        type="search"
        value={activeSearchQuery}
      />

      {pickerTab === 'awakeners' ? (
        <div className="mt-2 grid grid-cols-5 gap-1">
          {awakenerFilterTabs.map((filterTab) => (
            <button
              className={`border compact-filter-chip transition-colors ${
                awakenerFilter === filterTab.id
                  ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                  : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
              }`}
              key={filterTab.id}
              onClick={() => onAwakenerFilterChange(filterTab.id)}
              type="button"
            >
              {filterTab.label}
            </button>
          ))}
        </div>
      ) : null}

      {pickerTab === 'posses' ? (
        <div className="mt-2 grid grid-cols-3 gap-1">
          {posseFilterTabs.map((filterTab) => (
            <button
              className={`border compact-filter-chip transition-colors ${
                posseFilter === filterTab.id
                  ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                  : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
              }`}
              key={filterTab.id}
              onClick={() => onPosseFilterChange(filterTab.id)}
              type="button"
            >
              {filterTab.label}
            </button>
          ))}
        </div>
      ) : null}

      {pickerTab === 'wheels' ? (
        <>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {wheelRarityFilterTabs.map((filterTab) => (
              <button
                aria-pressed={wheelRarityFilter === filterTab.id}
                className={`border compact-filter-chip transition-colors ${
                  wheelRarityFilter === filterTab.id
                    ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                    : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                }`}
                key={filterTab.id}
                onClick={() => onWheelRarityFilterChange(filterTab.id)}
                type="button"
              >
                {filterTab.label}
              </button>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-9 gap-1">
            {wheelMainstatFilterOptions.map((filterTab) => (
              <button
                aria-label={`Filter wheels by ${filterTab.label}`}
                aria-pressed={wheelMainstatFilter === filterTab.id}
                className={`flex h-7 items-center justify-center border transition-colors ${
                  wheelMainstatFilter === filterTab.id
                    ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                    : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                }`}
                key={filterTab.id}
                onClick={() => onWheelMainstatFilterChange(filterTab.id)}
                title={filterTab.label}
                type="button"
              >
                {filterTab.iconAsset ? (
                  <img
                    alt={filterTab.label}
                    className="h-[17px] w-[17px] object-contain opacity-95"
                    draggable={false}
                    src={filterTab.iconAsset}
                  />
                ) : (
                  <span className="text-[10px] uppercase tracking-wide">All</span>
                )}
              </button>
            ))}
          </div>
        </>
      ) : null}

            <p className="mt-2 text-xs text-slate-200">Drag and drop from the list to deploy or replace, clicking replaces the active slot, or fills an empty one if available. </p>


      <PickerDropZone className="builder-picker-scrollbar mt-3 min-h-0 flex-1 overflow-auto pr-1" id={PICKER_DROP_ZONE_ID}>
        {pickerTab === 'awakeners' ? (
          <div className="grid grid-cols-4 gap-1.5">
            {filteredAwakeners.map((awakener) => (
              <PickerAwakenerTile
                awakenerName={awakener.name}
                faction={awakener.faction}
                isFactionBlocked={teamFactionSet.size >= 2 && !teamFactionSet.has(awakener.faction.trim().toUpperCase())}
                isInUse={!allowDupes && usedAwakenerIdentityKeys.has(getAwakenerIdentityKey(awakener.name))}
                isOwned={(ownedAwakenerLevelByName.get(awakener.name) ?? null) !== null}
                key={awakener.name}
                onClick={() => onAwakenerClick(awakener.name)}
              />
            ))}
          </div>
        ) : null}

        {pickerTab === 'wheels' ? (
          <div className="grid grid-cols-4 gap-2">
            <PickerWheelTile isNotSet onClick={() => onSetActiveWheel(undefined)} />

            {filteredWheels.map((wheel) => {
              const wheelAsset = getWheelAssetById(wheel.id)
              const usedByTeam = allowDupes ? undefined : usedWheelByTeamOrder.get(wheel.id)
              const isUsedByOtherTeam = usedByTeam && usedByTeam.teamId !== effectiveActiveTeamId
              const blockedText = usedByTeam
                ? isUsedByOtherTeam
                  ? `Used in ${toOrdinal(usedByTeam.teamOrder + 1)} team`
                  : 'Already used'
                : null

              return (
                <PickerWheelTile
                  blockedText={blockedText}
                  isBlocked={Boolean(isUsedByOtherTeam)}
                  isInUse={Boolean(usedByTeam)}
                  isOwned={(ownedWheelLevelById.get(wheel.id) ?? null) !== null}
                  key={wheel.id}
                  onClick={() => onSetActiveWheel(wheel.id)}
                  wheelAsset={wheelAsset}
                  wheelId={wheel.id}
                  wheelName={wheel.name}
                />
              )
            })}
          </div>
        ) : null}

        {pickerTab === 'covenants' ? (
          <div className="grid grid-cols-4 gap-2">
            <PickerCovenantTile isNotSet onClick={() => onSetActiveCovenant(undefined)} />
            {filteredCovenants.map((covenant) => {
              const covenantAsset = getCovenantAssetById(covenant.id)

              return (
                <PickerCovenantTile
                  covenantAsset={covenantAsset}
                  covenantId={covenant.id}
                  covenantName={covenant.name}
                  key={covenant.id}
                  onClick={() => onSetActiveCovenant(covenant.id)}
                />
              )
            })}
          </div>
        ) : null}

        {pickerTab === 'posses' ? (
          <div className="grid grid-cols-4 gap-2">
            <button
              className={`border p-1 text-left transition-colors ${
                !activePosseId
                  ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                  : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
              }`}
              onClick={() => onSetActivePosse(undefined)}
              type="button"
            >
              <div className="aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70">
                <span className="builder-disabled-icon">
                  <span className="builder-disabled-icon__glyph" />
                </span>
              </div>
              <p className="mt-1 truncate text-[11px] text-slate-200">Not Set</p>
            </button>

            {filteredPosses.map((posse) => {
              const posseAsset = getPosseAssetById(posse.id)
              const isActive = activePosseId === posse.id
              const usedByTeamOrder = allowDupes ? undefined : usedPosseByTeamOrder.get(posse.id)
              const usedByTeam = usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder]
              const isUsedByOtherTeam =
                usedByTeamOrder !== undefined &&
                usedByTeam?.id !== effectiveActiveTeamId
              const blockedText = isUsedByOtherTeam ? `Used in ${toOrdinal(usedByTeamOrder + 1)} team` : null
              const ownedLevel = ownedPosseLevelById.get(posse.id) ?? null

              return (
                <button
                  className={`border p-1 text-left transition-colors ${
                    isActive
                      ? 'border-amber-200/60 bg-slate-800/80'
                    : isUsedByOtherTeam
                        ? 'border-slate-500/45 bg-slate-900/45 opacity-55'
                      : ownedLevel === null
                        ? 'border-rose-300/35 bg-slate-900/55 hover:border-rose-200/45'
                        : 'border-slate-500/45 bg-slate-900/55 hover:border-amber-200/45'
                  }`}
                  aria-disabled={isUsedByOtherTeam}
                  key={posse.id}
                  onClick={() => onSetActivePosse(posse.id)}
                  type="button"
                >
                  <div className="relative aspect-square overflow-hidden border border-slate-400/35 bg-slate-900/70">
                    {posseAsset ? (
                      <img
                        alt={`${posse.name} posse`}
                        className={`h-full w-full object-cover ${ownedLevel === null ? 'builder-picker-art-unowned' : ''} ${
                          blockedText ? 'builder-picker-art-dimmed' : ''
                        }`}
                        draggable={false}
                        src={posseAsset}
                      />
                    ) : (
                      <span className="relative block h-full w-full">
                        <span className="sigil-placeholder" />
                      </span>
                    )}
                    {blockedText ? (
                      <span className="pointer-events-none absolute inset-x-0 top-0 truncate border-y border-slate-300/30 bg-slate-950/62 px-1 py-0.5 text-center text-[9px] tracking-wide text-slate-100/90">
                        {blockedText}
                      </span>
                    ) : ownedLevel === null ? (
                      <span className="pointer-events-none absolute inset-x-0 top-0 truncate border-y border-rose-300/25 bg-slate-950/70 px-1 py-0.5 text-center text-[9px] tracking-wide text-rose-100/95">
                        Unowned
                      </span>
                    ) : null}
                  </div>
                  <p className={`mt-1 truncate text-[11px] ${isActive ? 'text-amber-100' : 'text-slate-200'}`}>
                    {posse.name}
                  </p>
                </button>
              )
            })}
          </div>
        ) : null}
      </PickerDropZone>
      </TabbedContainer>
    </aside>
  )
}
