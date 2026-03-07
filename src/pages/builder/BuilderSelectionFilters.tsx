import type {RefObject} from 'react'

import type {
  AwakenerFilter,
  PickerTab,
  PosseFilter,
  WheelMainstatFilter,
  WheelRarityFilter,
} from './types'
import {wheelMainstatFilterOptions} from './wheel-mainstats'

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
  return `compact-filter-chip border transition-colors ${
    isActive
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

interface BuilderSelectionFiltersProps {
  searchInputRef: RefObject<HTMLInputElement | null>
  pickerTab: PickerTab
  activeSearchQuery: string
  awakenerFilter: AwakenerFilter
  posseFilter: PosseFilter
  wheelRarityFilter: WheelRarityFilter
  wheelMainstatFilter: WheelMainstatFilter
  onSearchChange: (nextValue: string) => void
  onAwakenerFilterChange: (nextFilter: AwakenerFilter) => void
  onPosseFilterChange: (nextFilter: PosseFilter) => void
  onWheelRarityFilterChange: (nextFilter: WheelRarityFilter) => void
  onWheelMainstatFilterChange: (nextFilter: WheelMainstatFilter) => void
}

export function BuilderSelectionFilters({
  searchInputRef,
  pickerTab,
  activeSearchQuery,
  awakenerFilter,
  posseFilter,
  wheelRarityFilter,
  wheelMainstatFilter,
  onSearchChange,
  onAwakenerFilterChange,
  onPosseFilterChange,
  onWheelRarityFilterChange,
  onWheelMainstatFilterChange,
}: BuilderSelectionFiltersProps) {
  return (
    <>
      <input
        className='mt-3 w-full border border-slate-800/95 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
        onChange={(event) => {
          onSearchChange(event.target.value)
        }}
        placeholder={getPickerSearchPlaceholder(pickerTab)}
        ref={searchInputRef}
        type='search'
        value={activeSearchQuery}
      />

      {pickerTab === 'awakeners' ? (
        <div className='mt-2 grid grid-cols-5 gap-1'>
          {awakenerFilterTabs.map((filterTab) => (
            <button
              className={getCompactFilterChipClassName(awakenerFilter === filterTab.id)}
              key={filterTab.id}
              onClick={() => {
                onAwakenerFilterChange(filterTab.id)
              }}
              type='button'
            >
              {filterTab.label}
            </button>
          ))}
        </div>
      ) : null}

      {pickerTab === 'posses' ? (
        <div className='mt-2 grid grid-cols-3 gap-1'>
          {posseFilterTabs.map((filterTab) => (
            <button
              className={getCompactFilterChipClassName(posseFilter === filterTab.id)}
              key={filterTab.id}
              onClick={() => {
                onPosseFilterChange(filterTab.id)
              }}
              type='button'
            >
              {filterTab.label}
            </button>
          ))}
        </div>
      ) : null}

      {pickerTab === 'wheels' ? (
        <>
          <div className='mt-2 grid grid-cols-4 gap-1'>
            {wheelRarityFilterTabs.map((filterTab) => (
              <button
                aria-pressed={wheelRarityFilter === filterTab.id}
                className={getCompactFilterChipClassName(wheelRarityFilter === filterTab.id)}
                key={filterTab.id}
                onClick={() => {
                  onWheelRarityFilterChange(filterTab.id)
                }}
                type='button'
              >
                {filterTab.label}
              </button>
            ))}
          </div>
          <div className='mt-1.5 grid grid-cols-9 gap-1'>
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
                onClick={() => {
                  onWheelMainstatFilterChange(filterTab.id)
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
        </>
      ) : null}
    </>
  )
}
