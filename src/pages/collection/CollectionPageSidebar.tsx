import {Button} from '@/components/ui/Button'
import {PanelSection} from '@/components/ui/PanelSection'
import {TogglePill} from '@/components/ui/TogglePill'
import {wheelMainstatFilterOptions} from '@/domain/wheel-mainstat-filters'

import type {CollectionViewModel} from './useCollectionViewModel'

const awakenerFilterTabs = [
  {id: 'ALL', label: 'All'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
] as const

const wheelRarityFilterTabs = [
  {id: 'ALL', label: 'All'},
  {id: 'SSR', label: 'SSR'},
  {id: 'SR', label: 'SR'},
  {id: 'R', label: 'R'},
] as const

const posseFilterTabs = [
  {id: 'ALL', label: 'All'},
  {id: 'FADED_LEGACY', label: 'Faded Legacy'},
  {id: 'AEQUOR', label: 'Aequor'},
  {id: 'CARO', label: 'Caro'},
  {id: 'CHAOS', label: 'Chaos'},
  {id: 'ULTRA', label: 'Ultra'},
] as const

const collectionLabelByTab = {
  awakeners: 'awakeners',
  wheels: 'wheels',
  posses: 'posses',
} as const

function getActiveFilteredCount(model: CollectionViewModel): number {
  if (model.tab === 'awakeners') {
    return model.filteredAwakeners.length
  }

  if (model.tab === 'wheels') {
    return model.filteredWheels.length
  }

  return model.filteredPosses.length
}

function getSearchPlaceholder(tab: CollectionViewModel['tab']): string {
  if (tab === 'awakeners') {
    return 'Search awakeners (name, realm, aliases)'
  }

  if (tab === 'wheels') {
    return 'Search wheels (name, rarity, realm, awakener, main stat)'
  }

  return 'Search posses (name, realm, awakener)'
}

function getFilterChipClassName(isActive: boolean): string {
  return `compact-filter-chip border transition-colors ${
    isActive
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

interface CollectionPageSidebarProps {
  model: CollectionViewModel
  searchInputRef: {current: HTMLInputElement | null}
}

export function CollectionPageSidebar({model, searchInputRef}: CollectionPageSidebarProps) {
  const activeCollectionLabel = collectionLabelByTab[model.tab]
  const activeFilteredCount = getActiveFilteredCount(model)
  const searchPlaceholder = getSearchPlaceholder(model.tab)
  const batchActionsDescription = `These actions apply ALL of the currently filtered and displayed ${activeCollectionLabel} (${String(activeFilteredCount)}).`

  return (
    <aside className='flex min-h-[560px] flex-col border border-slate-500/45 bg-slate-900/45 p-3'>
      <PanelSection
        description='Search, filters and display toggles for the active collection tab.'
        title='Navigation'
      >
        <div className='mt-2 flex items-center justify-between gap-3 text-xs text-slate-300'>
          <span>Display Unowned</span>
          <TogglePill
            ariaLabel='Toggle display unowned'
            checked={model.displayUnowned}
            className='ownership-pill-builder'
            offLabel='Off'
            onChange={() => {
              model.setDisplayUnowned(!model.displayUnowned)
            }}
            onLabel='On'
            variant='flat'
          />
        </div>

        {model.tab === 'awakeners' ? (
          <div className='mt-2 flex items-center justify-between gap-3 text-xs text-slate-300'>
            <span>Group By Realm</span>
            <TogglePill
              ariaLabel='Toggle grouping awakeners by realm'
              checked={model.awakenerSortGroupByRealm}
              className='ownership-pill-builder'
              offLabel='Off'
              onChange={() => {
                model.setAwakenerSortGroupByRealm(!model.awakenerSortGroupByRealm)
              }}
              onLabel='On'
              variant='flat'
            />
          </div>
        ) : null}

        <input
          className='mt-2 w-full border border-slate-800/95 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
          onChange={(event) => {
            model.setQuery(event.target.value)
          }}
          placeholder={searchPlaceholder}
          ref={searchInputRef}
          type='search'
          value={model.activeQuery}
        />

        {model.tab === 'awakeners' ? (
          <div className='mt-2 grid grid-cols-5 gap-1'>
            {awakenerFilterTabs.map((entry) => (
              <button
                className={getFilterChipClassName(model.awakenerFilter === entry.id)}
                key={entry.id}
                onClick={() => {
                  model.setAwakenerFilter(entry.id)
                }}
                type='button'
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}

        {model.tab === 'wheels' ? (
          <>
            <div className='mt-2 grid grid-cols-4 gap-1'>
              {wheelRarityFilterTabs.map((entry) => (
                <button
                  className={getFilterChipClassName(model.wheelRarityFilter === entry.id)}
                  key={entry.id}
                  onClick={() => {
                    model.setWheelRarityFilter(entry.id)
                  }}
                  type='button'
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <div className='mt-1.5 grid grid-cols-9 gap-1'>
              {wheelMainstatFilterOptions.map((entry) => (
                <button
                  aria-label={`Filter wheels by ${entry.label}`}
                  className={`flex h-7 items-center justify-center border transition-colors ${
                    model.wheelMainstatFilter === entry.id
                      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
                      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
                  }`}
                  key={entry.id}
                  onClick={() => {
                    model.setWheelMainstatFilter(entry.id)
                  }}
                  title={entry.label}
                  type='button'
                >
                  {entry.iconAsset ? (
                    <img
                      alt={entry.label}
                      className='h-[17px] w-[17px] object-contain opacity-95'
                      draggable={false}
                      src={entry.iconAsset}
                    />
                  ) : (
                    <span className='text-[10px] tracking-wide uppercase'>All</span>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {model.tab === 'posses' ? (
          <div className='mt-2 grid grid-cols-3 gap-1'>
            {posseFilterTabs.map((entry) => (
              <button
                className={getFilterChipClassName(model.posseFilter === entry.id)}
                key={entry.id}
                onClick={() => {
                  model.setPosseFilter(entry.id)
                }}
                type='button'
              >
                {entry.label}
              </button>
            ))}
          </div>
        ) : null}
      </PanelSection>

      <PanelSection
        className='mt-auto border-t border-slate-500/45 pt-2'
        description={batchActionsDescription}
        title='Batch Actions'
      >
        <div className='space-y-2'>
          <div className='grid grid-cols-2 gap-1'>
            <Button
              className='h-7 w-full px-2 py-1 text-[10px] tracking-wide uppercase hover:border-emerald-300/55 hover:text-emerald-200'
              disabled={activeFilteredCount === 0}
              onClick={model.markFilteredOwned}
              type='button'
            >
              Set Owned
            </Button>
            <Button
              className='h-7 w-full px-2 py-1 text-[10px] tracking-wide uppercase hover:border-rose-300/55 hover:text-rose-200'
              disabled={activeFilteredCount === 0}
              onClick={model.markFilteredUnowned}
              type='button'
            >
              Set Unowned
            </Button>
          </div>

          {model.tab === 'awakeners' || model.tab === 'wheels' ? (
            <div className='grid grid-cols-[84px_repeat(4,minmax(0,1fr))] items-center gap-1'>
              <span className='justify-self-end text-[10px] tracking-wide text-slate-400 uppercase'>
                Enlightens:
              </span>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredEnlightenPreset(0)
                }}
                type='button'
              >
                0
              </Button>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredEnlightenPreset(3)
                }}
                type='button'
              >
                3
              </Button>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredEnlightenPreset(7)
                }}
                type='button'
              >
                +4
              </Button>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredEnlightenPreset(15)
                }}
                type='button'
              >
                +12
              </Button>
            </div>
          ) : null}

          {model.tab === 'awakeners' ? (
            <div className='grid grid-cols-[84px_repeat(4,minmax(0,1fr))] items-center gap-1'>
              <span className='justify-self-end text-[10px] tracking-wide text-slate-400 uppercase'>
                Levels:
              </span>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredAwakenerLevelsPreset('0')
                }}
                type='button'
              >
                1
              </Button>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredAwakenerLevelsPreset('60')
                }}
                type='button'
              >
                60
              </Button>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredAwakenerLevelsPreset('-10')
                }}
                type='button'
              >
                -10
              </Button>
              <Button
                className='h-7 w-full min-w-0 px-2 py-1 text-[10px] tracking-wide uppercase'
                disabled={activeFilteredCount === 0}
                onClick={() => {
                  model.setFilteredAwakenerLevelsPreset('+10')
                }}
                type='button'
              >
                +10
              </Button>
            </div>
          ) : null}
        </div>
      </PanelSection>
    </aside>
  )
}
