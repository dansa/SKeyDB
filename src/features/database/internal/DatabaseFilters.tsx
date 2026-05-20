import {useState, type RefObject} from 'react'

import {
  getAwakenerScalingSubstatFilterOptions,
  type SubstatScalingKey,
} from '@/domain/awakener-scaling-substats'
import {
  DATABASE_AVAILABILITY_FILTER_IDS,
  DATABASE_GAMEPLAY_FACTION_FILTER_IDS,
  DATABASE_RARITY_FILTER_IDS,
  DATABASE_REALM_FILTER_IDS,
  DATABASE_TYPE_FILTER_IDS,
  getAvailabilityFilterLabel,
  getTypeFilterLabel,
  type AvailabilityFilterId,
  type GameplayFactionFilterId,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from '@/domain/database-browse-state'
import {ChipFilterRow} from '@/ui/filters/ChipFilterRow'
import {FilterChipButton} from '@/ui/filters/FilterChipButton'
import {FilterRow} from '@/ui/filters/FilterRow'
import {SearchInput} from '@/ui/search/SearchInput'

import {CatalogMobileFilterGroup, CatalogRealmFilterRow} from './DatabaseChipPrimitives'
import {useMobileDatabaseFilters} from './useMobileDatabaseFilters'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  availabilityFilter: AvailabilityFilterId
  gameplayFactionFilters: readonly GameplayFactionFilterId[]
  scalingSubstatFilters: readonly SubstatScalingKey[]
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
  onAvailabilityFilterChange: (filter: AvailabilityFilterId) => void
  onGameplayFactionFilterToggle: (filter: GameplayFactionFilterId) => void
  onScalingSubstatFilterToggle: (filter: SubstatScalingKey) => void
}

const REALM_FILTERS = DATABASE_REALM_FILTER_IDS.slice(1)

const rarityFilterTabs = DATABASE_RARITY_FILTER_IDS.map((id) => ({
  id,
  label: id === 'ALL' ? 'All' : id,
  summaryLabel: id === 'ALL' ? 'All' : id,
}))

const typeFilterTabs = DATABASE_TYPE_FILTER_IDS.map((id) => ({
  id,
  label: getTypeFilterLabel(id),
  summaryLabel: getTypeFilterLabel(id),
}))

const availabilityFilterTabs = DATABASE_AVAILABILITY_FILTER_IDS.map((id) => ({
  id,
  label: getAvailabilityFilterLabel(id),
  summaryLabel: getAvailabilityFilterLabel(id),
}))

const gameplayFactionOptions = DATABASE_GAMEPLAY_FACTION_FILTER_IDS.map((id) => ({
  id,
  label: id,
}))

const scalingSubstatOptions = getAwakenerScalingSubstatFilterOptions()

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  availabilityFilter,
  gameplayFactionFilters,
  scalingSubstatFilters,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
  onAvailabilityFilterChange,
  onGameplayFactionFilterToggle,
  onScalingSubstatFilterToggle,
}: DatabaseFiltersProps) {
  const [openMobileFilter, setOpenMobileFilter] = useState<'rarity' | 'type' | 'source' | null>(
    null,
  )
  const isMobileFilters = useMobileDatabaseFilters()

  return (
    <div className='space-y-3 sm:space-y-3.5'>
      <SearchInput
        label='Search awakeners'
        onQueryChange={onQueryChange}
        placeholder='Name, tag, realm, or role'
        query={query}
        searchInputRef={searchInputRef}
      />
      {isMobileFilters ? (
        <div className='space-y-2.5'>
          <CatalogRealmFilterRow
            activeRealm={realmFilter}
            onChange={onRealmFilterChange}
            realms={REALM_FILTERS}
          />

          <CatalogMobileFilterGroup
            groups={[
              {
                activeId: rarityFilter,
                defaultId: 'ALL',
                key: 'rarity',
                label: 'Rarity',
                onChange: (next) => {
                  onRarityFilterChange(next as RarityFilterId)
                },
                options: rarityFilterTabs,
              },
              {
                activeId: typeFilter,
                defaultId: 'ALL',
                key: 'type',
                label: 'Type',
                onChange: (next) => {
                  onTypeFilterChange(next as TypeFilterId)
                },
                options: typeFilterTabs,
              },
              {
                activeId: availabilityFilter,
                defaultId: 'ALL',
                key: 'source',
                label: 'Source',
                onChange: (next) => {
                  onAvailabilityFilterChange(next as AvailabilityFilterId)
                },
                options: availabilityFilterTabs,
                toggleClassName: 'col-span-2',
              },
            ]}
            onOpenKeyChange={setOpenMobileFilter}
            openKey={openMobileFilter}
          />
          <AwakenerAdvancedFilters
            gameplayFactionFilters={gameplayFactionFilters}
            onGameplayFactionFilterToggle={onGameplayFactionFilterToggle}
            onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
            scalingSubstatFilters={scalingSubstatFilters}
          />
        </div>
      ) : (
        <div className='space-y-2.5 sm:space-y-3'>
          <div className='grid gap-2 lg:grid-cols-2'>
            <CatalogRealmFilterRow
              activeRealm={realmFilter}
              onChange={onRealmFilterChange}
              realms={REALM_FILTERS}
            />

            <ChipFilterRow
              activeId={rarityFilter}
              label='Rarity'
              onChange={onRarityFilterChange}
              options={rarityFilterTabs}
            />
          </div>

          <ChipFilterRow
            activeId={typeFilter}
            label='Type'
            onChange={onTypeFilterChange}
            options={typeFilterTabs}
          />
          <ChipFilterRow
            activeId={availabilityFilter}
            label='Source'
            onChange={onAvailabilityFilterChange}
            options={availabilityFilterTabs}
          />
          <AwakenerAdvancedFilters
            gameplayFactionFilters={gameplayFactionFilters}
            onGameplayFactionFilterToggle={onGameplayFactionFilterToggle}
            onScalingSubstatFilterToggle={onScalingSubstatFilterToggle}
            scalingSubstatFilters={scalingSubstatFilters}
          />
        </div>
      )}
    </div>
  )
}

interface AwakenerAdvancedFiltersProps {
  gameplayFactionFilters: readonly GameplayFactionFilterId[]
  scalingSubstatFilters: readonly SubstatScalingKey[]
  onGameplayFactionFilterToggle: (filter: GameplayFactionFilterId) => void
  onScalingSubstatFilterToggle: (filter: SubstatScalingKey) => void
}

function AwakenerAdvancedFilters({
  gameplayFactionFilters,
  onGameplayFactionFilterToggle,
  onScalingSubstatFilterToggle,
  scalingSubstatFilters,
}: AwakenerAdvancedFiltersProps) {
  const activeCount = gameplayFactionFilters.length + scalingSubstatFilters.length
  const [open, setOpen] = useState(activeCount > 0)

  return (
    <div className='border-t border-slate-800/70 pt-2.5'>
      <button
        aria-expanded={open}
        className={`flex min-h-9 w-full items-center justify-between gap-3 rounded-[2px] border px-2.5 py-2 text-left text-[11px] transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:border-amber-200/70 focus-visible:ring-2 focus-visible:ring-amber-200/30 focus-visible:outline-none ${
          open || activeCount > 0
            ? 'border-amber-300/38 bg-slate-950/62 text-amber-50'
            : 'border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(10,15,28,0.58))] text-slate-300 hover:border-slate-500/70 hover:bg-slate-900/70'
        }`}
        onClick={() => {
          setOpen((current) => !current)
        }}
        type='button'
      >
        <span className='tracking-[0.16em] text-slate-400 uppercase'>Advanced filters</span>
        <span className='flex items-center gap-2'>
          {activeCount > 0 ? (
            <span className='rounded-[2px] border border-amber-300/30 bg-amber-300/10 px-1.5 py-0.5 text-amber-100'>
              {activeCount} active
            </span>
          ) : null}
          <span aria-hidden='true' className={open ? 'text-amber-200' : 'text-slate-500'}>
            {open ? '-' : '+'}
          </span>
        </span>
      </button>

      {open ? (
        <div className='space-y-2.5 border-x border-b border-slate-800/70 bg-slate-950/20 px-2.5 py-2.5 sm:px-3'>
          <FilterRow label='Faction'>
            {gameplayFactionOptions.map((option) => (
              <FilterChipButton
                active={gameplayFactionFilters.includes(option.id)}
                key={option.id}
                onClick={() => {
                  onGameplayFactionFilterToggle(option.id)
                }}
              >
                {option.label}
              </FilterChipButton>
            ))}
          </FilterRow>

          <FilterRow
            controlsClassName='grid min-w-0 flex-1 grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center'
            label='Scaling'
          >
            {scalingSubstatOptions.map((option) => (
              <FilterChipButton
                active={scalingSubstatFilters.includes(option.id)}
                className='w-full min-w-0 justify-start sm:w-auto'
                key={option.id}
                onClick={() => {
                  onScalingSubstatFilterToggle(option.id)
                }}
              >
                {option.iconAsset ? (
                  <img
                    alt=''
                    className='h-3.5 w-3.5 shrink-0 object-contain'
                    draggable={false}
                    src={option.iconAsset}
                  />
                ) : null}
                <span className='truncate'>{option.label}</span>
              </FilterChipButton>
            ))}
          </FilterRow>
        </div>
      ) : null}
    </div>
  )
}
