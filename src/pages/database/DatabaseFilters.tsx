import type {ReactNode, RefObject} from 'react'

import {CollectionSortControls} from '@/components/ui/CollectionSortControls'
import {TogglePill} from '@/components/ui/TogglePill'
import type {CollectionSortDirection} from '@/domain/collection-sorting'
import type {DatabaseSortKey} from '@/domain/database-sorting'
import {getRealmIcon, getRealmLabel, getRealmTint} from '@/domain/factions'

import {
  DATABASE_SORT_OPTIONS,
  type RarityFilterId,
  type RealmFilterId,
  type TypeFilterId,
} from './useDatabaseViewModel'

interface DatabaseFiltersProps {
  query: string
  realmFilter: RealmFilterId
  rarityFilter: RarityFilterId
  typeFilter: TypeFilterId
  sortKey: DatabaseSortKey
  sortDirection: CollectionSortDirection
  groupByRealm: boolean
  totalCount: number
  filteredCount: number
  searchInputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (query: string) => void
  onRealmFilterChange: (filter: RealmFilterId) => void
  onRarityFilterChange: (filter: RarityFilterId) => void
  onTypeFilterChange: (filter: TypeFilterId) => void
  onSortKeyChange: (key: DatabaseSortKey) => void
  onSortDirectionToggle: () => void
  onGroupByRealmChange: (next: boolean) => void
}

const REALM_FILTERS: RealmFilterId[] = ['AEQUOR', 'CARO', 'CHAOS', 'ULTRA']

const rarityFilterTabs: {id: RarityFilterId; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'Genesis', label: 'Genesis'},
  {id: 'SSR', label: 'SSR'},
  {id: 'SR', label: 'SR'},
]

const typeFilterTabs: {id: TypeFilterId; label: string}[] = [
  {id: 'ALL', label: 'All'},
  {id: 'ASSAULT', label: 'Assault'},
  {id: 'WARDEN', label: 'Warden'},
  {id: 'CHORUS', label: 'Chorus'},
]

function chipClass(active: boolean): string {
  return `inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] uppercase tracking-wide transition-colors ${
    active
      ? 'border-amber-200/60 bg-slate-800/80 text-amber-100'
      : 'border-slate-500/45 bg-slate-900/55 text-slate-300 hover:border-amber-200/45'
  }`
}

interface FilterRowProps {
  label: string
  children: ReactNode
}

function FilterRow({label, children}: FilterRowProps) {
  return (
    <div className='flex items-center gap-3'>
      <span className='w-14 shrink-0 text-[10px] tracking-wide text-slate-500 uppercase'>
        {label}
      </span>
      <div className='flex flex-wrap items-center gap-1.5'>{children}</div>
    </div>
  )
}

export function DatabaseFilters({
  query,
  realmFilter,
  rarityFilter,
  typeFilter,
  sortKey,
  sortDirection,
  groupByRealm,
  totalCount,
  filteredCount,
  searchInputRef,
  onQueryChange,
  onRealmFilterChange,
  onRarityFilterChange,
  onTypeFilterChange,
  onSortKeyChange,
  onSortDirectionToggle,
  onGroupByRealmChange,
}: DatabaseFiltersProps) {
  return (
    <div className='space-y-2 border-b border-slate-600/40 pb-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <input
          className='max-w-md min-w-0 flex-1 border border-slate-800/95 bg-slate-950/90 px-3 py-1.5 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-300/65 focus:bg-slate-950'
          onChange={(event) => {
            onQueryChange(event.target.value)
          }}
          placeholder='Search awakeners... (name, tags, realm, etc.)'
          ref={searchInputRef}
          type='search'
          value={query}
        />
        <span className='text-[10px] text-slate-400'>
          {filteredCount}/{totalCount}
        </span>
      </div>

      <FilterRow label='Realm'>
        <button
          className={chipClass(realmFilter === 'ALL')}
          onClick={() => {
            onRealmFilterChange('ALL')
          }}
          type='button'
        >
          All
        </button>
        {REALM_FILTERS.map((realm) => {
          const active = realmFilter === realm
          const tint = getRealmTint(realm)
          const icon = getRealmIcon(realm)
          return (
            <button
              className={chipClass(active)}
              key={realm}
              onClick={() => {
                onRealmFilterChange(realm)
              }}
              style={active ? {borderColor: `${tint}88`, color: tint} : undefined}
              type='button'
            >
              {icon ? <img alt='' className='h-3.5 w-3.5' draggable={false} src={icon} /> : null}
              {getRealmLabel(realm)}
            </button>
          )
        })}
      </FilterRow>

      <FilterRow label='Rarity'>
        {rarityFilterTabs.map((entry) => (
          <button
            className={chipClass(rarityFilter === entry.id)}
            key={entry.id}
            onClick={() => {
              onRarityFilterChange(entry.id)
            }}
            type='button'
          >
            {entry.label}
          </button>
        ))}
      </FilterRow>

      <FilterRow label='Type'>
        {typeFilterTabs.map((entry) => (
          <button
            className={chipClass(typeFilter === entry.id)}
            key={entry.id}
            onClick={() => {
              onTypeFilterChange(entry.id)
            }}
            type='button'
          >
            {entry.label}
          </button>
        ))}
      </FilterRow>

      <FilterRow label='Sort'>
        <CollectionSortControls
          groupByRealm={groupByRealm}
          layout='compact'
          onGroupByRealmChange={onGroupByRealmChange}
          onSortDirectionToggle={onSortDirectionToggle}
          onSortKeyChange={(nextKey) => {
            onSortKeyChange(nextKey as DatabaseSortKey)
          }}
          showGroupByRealm={false}
          sortDirection={sortDirection}
          sortKey={sortKey}
          sortOptions={DATABASE_SORT_OPTIONS}
          sortDirectionAriaLabel='Toggle database sort direction'
          sortSelectAriaLabel='Database sort key'
        />
        <span className='mx-0.5 h-4 w-px bg-slate-600/40' />
        <span className='text-[10px] tracking-wide text-slate-500 uppercase'>Group By Realm</span>
        <TogglePill
          ariaLabel='Toggle grouping awakeners by realm'
          checked={groupByRealm}
          className='ownership-pill-builder'
          offLabel='Off'
          onChange={onGroupByRealmChange}
          onLabel='On'
          variant='flat'
        />
      </FilterRow>
    </div>
  )
}
