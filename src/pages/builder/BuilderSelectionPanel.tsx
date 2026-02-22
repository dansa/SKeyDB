import type { MutableRefObject } from 'react'
import { getAwakenerIdentityKey } from '../../domain/awakener-identity'
import type { Awakener } from '../../domain/awakeners'
import type { Covenant } from '../../domain/covenants'
import type { Posse } from '../../domain/posses'
import type { Wheel } from '../../domain/wheels'
import { getCovenantAssetById } from '../../domain/covenant-assets'
import { getPosseAssetById } from '../../domain/posse-assets'
import { getWheelAssetById } from '../../domain/wheel-assets'
import { PICKER_DROP_ZONE_ID } from './dnd-ids'
import { PickerCovenantTile } from './PickerCovenantTile'
import { PickerDropZone } from './PickerDropZone'
import { PickerAwakenerTile } from './PickerAwakenerTile'
import { PickerWheelTile } from './PickerWheelTile'
import { wheelMainstatFilterOptions } from './wheel-mainstats'
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

type BuilderSelectionPanelProps = {
  searchInputRef: MutableRefObject<HTMLInputElement | null>
  pickerTab: PickerTab
  activeSearchQuery: string
  awakenerFilter: AwakenerFilter
  posseFilter: PosseFilter
  wheelRarityFilter: WheelRarityFilter
  wheelMainstatFilter: WheelMainstatFilter
  filteredAwakeners: Awakener[]
  filteredPosses: Posse[]
  filteredWheels: Wheel[]
  filteredCovenants: Covenant[]
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
  filteredAwakeners,
  filteredPosses,
  filteredWheels,
  filteredCovenants,
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
  onAwakenerClick,
  onSetActiveWheel,
  onSetActiveCovenant,
  onSetActivePosse,
}: BuilderSelectionPanelProps) {
  return (
    <aside
      className="flex max-h-[calc(100dvh-11.5rem)] min-h-0 flex-col bg-slate-900/45 p-4 shadow-[inset_0_0_0_1px_rgba(100,116,139,0.5)]"
      data-picker-zone="true"
    >
      <h3 className="ui-title text-lg text-amber-100">Selection Queue</h3>
      <p className="mt-2 text-sm text-slate-200">Click adds to first empty slot. Drag to deploy or replace.</p>
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
      <div className="mt-3 grid grid-cols-4 gap-1">
        {pickerTabs.map((tab) => (
          <button
            className={`border px-2 py-1.5 text-[11px] tracking-wide transition-colors ${
              pickerTab === tab.id
                ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
            }`}
            key={tab.id}
            onClick={() => onPickerTabChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {pickerTab === 'awakeners' ? (
        <div className="mt-2 grid grid-cols-5 gap-1">
          {awakenerFilterTabs.map((filterTab) => (
            <button
              className={`border px-1 py-1 text-[10px] uppercase tracking-wide transition-colors ${
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
              className={`border px-1 py-1 text-[10px] uppercase tracking-wide transition-colors ${
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
                className={`border px-1 py-1 text-[10px] uppercase tracking-wide transition-colors ${
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

      <PickerDropZone className="builder-picker-scrollbar mt-3 min-h-0 flex-1 overflow-auto pr-1" id={PICKER_DROP_ZONE_ID}>
        {pickerTab === 'awakeners' ? (
          <div className="grid grid-cols-4 gap-1.5">
            {filteredAwakeners.map((awakener) => (
              <PickerAwakenerTile
                awakenerName={awakener.name}
                faction={awakener.faction}
                isFactionBlocked={teamFactionSet.size >= 2 && !teamFactionSet.has(awakener.faction.trim().toUpperCase())}
                isInUse={usedAwakenerIdentityKeys.has(getAwakenerIdentityKey(awakener.name))}
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
              const usedByTeam = usedWheelByTeamOrder.get(wheel.id)
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
          <div className="grid grid-cols-3 gap-2">
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
              const usedByTeamOrder = usedPosseByTeamOrder.get(posse.id)
              const usedByTeam = usedByTeamOrder === undefined ? undefined : teams[usedByTeamOrder]
              const isUsedByOtherTeam =
                usedByTeamOrder !== undefined &&
                usedByTeam?.id !== effectiveActiveTeamId
              const blockedText = isUsedByOtherTeam ? `Used in ${toOrdinal(usedByTeamOrder + 1)} team` : null

              return (
                <button
                  className={`border p-1 text-left transition-colors ${
                    isActive
                      ? 'border-amber-200/60 bg-slate-800/80'
                      : isUsedByOtherTeam
                        ? 'border-slate-500/45 bg-slate-900/45 opacity-55'
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
                        className="h-full w-full object-cover"
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
    </aside>
  )
}
